import { getNewRedisClient, IEvent } from 'ioredis-streams';
import { Redis } from 'ioredis';
import { config } from '../../config';


import loggerFactory from '../../utils/logging';
import { IScheduledEvent, Task } from '../../streams/events/scheduler';
import { TaskStatus } from '../../models/ITask';

const logger = loggerFactory.getLogger('RedisHandler');

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
    await this.client.xadd(streamName, '*', event.name, JSON.stringify(event));
  }


  private async transaction(commands: string[][]) {
    const result: [Error | null, any][] = await new Promise((resolve, reject) => {
      this.client.multi(commands).exec((err, res) => {
        if (err) reject(err);
        else resolve(res);
      })
    });

    return result;
  }



  async getTopItem() {
    const result: string | null = await new Promise((resolve, reject) => {
      this.client[CommandName.getTopTask](this.sortedSetKey, this.hashSetKey, (err, result) => {
        if (err) reject(null);
        else resolve(result)
      })
    });

    if (!result) return null;

    const parsed: [number, string, string] = JSON.parse(result);

    return <{ when: number, id: string, task: Task }>{
      when: parsed[0],
      id: parsed[1],
      task: JSON.parse(parsed[2])
    };
  }


  async addToSortedSet(item, value) {
    return new Promise((resolve, reject) => {
      this.client.zadd(this.sortedSetKey, value, item, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      })
    })
  }

  async deleteTask(id: string) {
    const commands: string[][] = [
      ['zrem', this.sortedSetKey, id],
      ['hdel', this.hashSetKey, id]
    ];
    await this.transaction(commands);
  }


  async deleteTaskAndPublish(id: string, task: Task) {
    const commands: string[][] = [
      ['zrem', this.sortedSetKey, id],
      ['hdel', this.hashSetKey, id],
      ['xadd', task.stream, '*', task.event.name, JSON.stringify(<IScheduledEvent<any>>{ ...task.event, from: { taskId: id } })]
    ];
    await this.transaction(commands);
  }

  async addTask(id: string, when: number, task: Task) {
    const commands: string[][] = [
      ['zadd', this.sortedSetKey, String(when), id],
      ['hset', this.hashSetKey, id, JSON.stringify(task)]
    ];
    await this.transaction(commands);
  }


  // can be 1 command zadd
  async addManyTasks(items: { id: string, when: number, task: Task }[]) {
    const commands: string[][] = items.map(({ id, when, task }) => [
      ['zadd', this.sortedSetKey, String(when), id],
      ['hset', this.hashSetKey, id, JSON.stringify(task)]
    ]).flat(1);
    const result = await this.transaction(commands);
    return result;
  }


  async getTopFromSortedSet(): Promise<[string, string]> {
    return new Promise((resolve, reject) => {

      this.client.zrange(this.sortedSetKey, 0, 0, "WITHSCORES", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result as [string, string]);
        }
      })
    })
  }

  async getHashSetItem(key: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      this.client.hget(this.hashSetKey, key, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      })
    })
  }
}

export const redisHandler = new RedisHandler();


enum CommandName {
  getTopTask = 'getTopTask'
}

const redisLuaCommands: { [name in CommandName]: { numberOfKeys: number, lua: string } } = {
  [CommandName.getTopTask]: {
    numberOfKeys: 2,
    lua: `
      local item, task
      item = redis.call('ZRANGE', KEYS[1], 0, 0)
      if (item == nil or next(item) == nil) then
        return nil
      end
      task = redis.call('HGET', KEYS[2], item[2]); 
      return { tonumber(item[1]), item[2], task }
      `
  }
}