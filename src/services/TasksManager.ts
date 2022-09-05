import { v4 as uuidV4 } from 'uuid';
import { R } from '../streams';
import { redisHandler, RedisHandler } from '../utils/redis/RedisHandler';
import config from '../config';
import { Task } from '../streams/events/scheduler';

class TasksManager {

  constructor(
    protected streams = R,
    protected redis: RedisHandler = redisHandler
  ) { }

  async saveTask(when: number, task: any) {
    const id = uuidV4();
    const item = [id, config.queueKey, task];
    let score = 0;
    let status = 'PENDING';
    score = new Date(when).getTime()
    console.log(`Push task ${id} to process later on ${when} `);
    await this.redis.AddToSortedSet(JSON.stringify(item), score);
    status = 'SCHEDULED';
    return ({ item, score, status });
  }

  async processEvents() {
    while (true) {
      try {
        await this.redis.lock.acquire(`LOCK:ZSET:ITEMS`);
        try {
          const value = await this.redis.GetTopFromSortedSet();
          if (value && value.length > 0) {
            const item = JSON.parse(value[0]);
            const when = parseFloat(value[1]);
            if (when <= Date.now()) {
              const task: Task = item[2];
              console.log(`Scheduled event ${task.event.name} ready to process for stream ${task.stream}`);

              const commands: string[][] = [['zrem', 'ZSET:SCHEDULED:ITEMS', value[0]]];
              if (task.type === 'publish_event') {
                commands.push(['xadd', task.stream, '*', task.event.name, JSON.stringify(task.event)]);
              } else {
                // do something else if not publish_event
              }
              await this.redis.transaction(commands);
            }
          } else {
            //No items to work process wait 1s before check again
            await this.redis.lock.release();
            await new Promise(r => setTimeout(r, 1000));
            continue;
          }
        } catch (ex: any) {
          console.log(`Error on event processing ${ex.message}`);
        }
        await this.redis.lock.release();
      } catch (ex) {
        // error in acquiring or releasing the lock
        console.log('lock error', JSON.stringify(ex));
      }
      await new Promise(r => setTimeout(r, 100));

    }
  }
}

export const taskManager = new TasksManager();