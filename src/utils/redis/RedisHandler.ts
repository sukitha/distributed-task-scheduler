import { getNewRedisClient, IEvent } from 'ioredis-streams';
import { Redis } from 'ioredis';
import { config } from '../../config';
// no types
import { createLock } from 'ioredis-lock';
import loggerFactory from '../../utils/logging';

const logger = loggerFactory.getLogger('RedisHandler');

type Lock = {
  acquire: (key: string) => Promise<void>;
  release: () => Promise<void>;
}

export class RedisHandler {
  private client: Redis;
  public lock: Lock;

  constructor(
  ) {
    this.client = getNewRedisClient({ host: config.redisHost, port: config.redisPort });
    this.lock = createLock(this.client);
  }

  async publishEvent<T>(streamName: string, event: IEvent<T>) {
    await this.client.xadd(streamName, '*', event.name, JSON.stringify(event));
  }

  async transaction(commands: string[][]) {
    const result: [Error | null, any][] = await new Promise((resolve, reject) => {
      this.client.multi(commands).exec((err, res) => {
        if (err) {
          // do something in case of failure?
          logger.error(`Transaction failed, ${JSON.stringify(err)}`);
          reject(err);
        } else {
          resolve(res);
        }
      })
    });

    return result;
  }

  async AddToSortedSet(item, value) {
    return new Promise((resolve, reject) => {
      this.client.zadd(`ZSET:SCHEDULED:ITEMS`, value, item, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      })
    })
  }

  async GetTopFromSortedSet(): Promise<string[] | undefined> {
    return new Promise((resolve, reject) => {

      this.client.zrange(`ZSET:SCHEDULED:ITEMS`, 0, 0, "WITHSCORES", (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      })
    })
  }

  async DeleteItemFromSet(item) {
    return new Promise((resolve, reject) => {

      this.client.zrem(`ZSET:SCHEDULED:ITEMS`, item, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      })
    })
  }
}


export const redisHandler = new RedisHandler();
