import { getNewRedisClient, IEvent } from 'ioredis-streams';
import { Redis } from 'ioredis';
import { config } from '../../config';
import loggerFactory from '../../utils/logging';
import { IScheduledEvent, Task } from '../../streams/events/scheduler';

const logger = loggerFactory.getLogger('RedisHandler');

enum CommandName {
  getTopTask = 'getTopTask'
}

const redisLuaCommands: { [name in CommandName]: { numberOfKeys: number, lua: string } } = {
  [CommandName.getTopTask]: {
    numberOfKeys: 2,
    lua: `
      local item, task
      item = redis.call('ZRANGE', KEYS[1], 0, 0, 'WITHSCORES')
      if (item == nil or next(item) == nil) then
        return nil
      end
      task = redis.call('HGET', KEYS[2], item[1]); 
      return { item[1], item[2], task }
      `
  }
}

export class RedisHandler {
  private client: Redis;
  private sortedSetKey = 'ZSET:SCHEDULED:ITEMS';
  private hashSetKey = 'HSET:ITEMS';

  constructor(
  ) {
    this.client = getNewRedisClient({ host: config.redisHost, port: config.redisPort });


    for (const name of Object.keys(redisLuaCommands)) {
      const { lua, numberOfKeys } = redisLuaCommands[name];
      this.client.defineCommand(name, { numberOfKeys, lua });
    }
  }

  async publishEvent<T>(streamName: string, event: IEvent<T>) {
    logger.info('publishEvent', JSON.stringify({ streamName, event }));
    await this.client.xadd(streamName, '*', event.name, JSON.stringify(event));
  }


  private async transaction(commands: string[][]) {
    const result: any = await new Promise((resolve, reject) => {
      this.client.multi(commands).exec((err, result) => {
        // logger.info('transaction', JSON.stringify({ err, result }));
        if (err) reject(err);
        else resolve(result);
      })
    });

    return result;
  }

  async getTopItem() {
    const result: [string, string, string] | null = await new Promise((resolve, reject) => {
      this.client[CommandName.getTopTask](this.sortedSetKey, this.hashSetKey, (err, result) => {
        if (err) {
          logger.error('getTopItem', JSON.stringify(err));
          reject(err);
        }
        else resolve(result)
      })
    });


    if (!result || !result.length) return null;

    return <{ id: string, when: number, task: Task }>{
      id: result[0],
      when: parseInt(result[1]),
      task: JSON.parse(result[2])
    };
  }

  async deleteTask(id: string) {
    logger.info('deleteTask', JSON.stringify({ id }));
    const commands: string[][] = [
      ['zrem', this.sortedSetKey, id],
      ['hdel', this.hashSetKey, id]
    ];
    await this.transaction(commands);
  }


  async deleteTaskAndPublish(id: string, task: Task) {
    logger.info('deleteTaskAndPublish', JSON.stringify({ id, task }));
    const commands: string[][] = [
      ['zrem', this.sortedSetKey, id],
      ['hdel', this.hashSetKey, id],
      ['xadd', task.stream, '*', task.event.name, JSON.stringify(<IScheduledEvent<any>>{ ...task.event, from: { taskId: id } })]
    ];
    await this.transaction(commands);
  }

  async addTask(id: string, when: number, task: Task) {
    logger.info('addTask', JSON.stringify({ id, when, task }));
    const commands: string[][] = [
      ['zadd', this.sortedSetKey, String(when), id],
      ['hset', this.hashSetKey, id, JSON.stringify(task)]
    ];
    await this.transaction(commands);
  }


  // can be 1 command zadd
  async addManyTasks(items: { id: string, when: number, task: Task }[]) {
    logger.info('addManyTasks', JSON.stringify(items));
    const commands: string[][] = items.map(({ id, when, task }) => [
      ['zadd', this.sortedSetKey, String(when), id],
      ['hset', this.hashSetKey, id, JSON.stringify(task)]
    ]).flat(1);
    const result = await this.transaction(commands);
    return result;
  }
}

export const redisHandler = new RedisHandler();

