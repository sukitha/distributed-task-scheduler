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
    if (when) {
      score = new Date(when).getTime()
      console.log(`Push task ${id} to process later on ${when} `);
      await this.redis.AddToSortedSet(JSON.stringify(item), score);
      status = 'SCHEDULED';

    } else {
      console.log(`Push task ${id} to execute in realtime`);
      await this.redis.AddItemToQueue(config.queueKey, JSON.stringify(item));
      status = 'QUEUED';
    }
    // await this.streams.scheduler.schedulerTaskCreated({
    //   id,
    //   exceutionTime: when,
    //   task
    // });
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
              console.log(`Scheduled item ${item[0]} ready to process`);
              console.log(item);
              await this.redis.DeleteItemFromSet(value[0]);
              await this.redis.AddItemToQueue(item[1], value[0]);
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


  async processTasks() {
    while (true) {
      const taskArray = await this.redis.GetItemFromQueueBlocking(config.queueKey);
      console.log({ taskArray });
      if (taskArray && taskArray.length > 1) {
        const task = JSON.parse(taskArray[1]);
        if (task && Array.isArray(task) && task.length > 2) {
          const item: Task = task[2];
          console.log({ item });
          if (item.type === 'publish_event') await this.redis.publishEvent(item.stream, item.event);
        }
      }
    }

  }
}

export const taskManager = new TasksManager();