import { getNewRedisClient, IEvent } from 'ioredis-streams';
import { Redis } from 'ioredis';
import { config } from '../../config';
// no types
import { createLock } from 'ioredis-lock';

type Lock = {
  acquire: (key: string) => Promise<void>;
  release: () => Promise<void>;
}

export class RedisHandler {
  private client: Redis;
  private blockingClient: Redis;
  public lock: Lock;

  constructor(
  ) {
    this.blockingClient = getNewRedisClient({ host: config.redisHost, port: config.redisPort });
    this.client = getNewRedisClient({ host: config.redisHost, port: config.redisPort });
    this.lock = createLock(this.client);
  }

  async publishEvent<T>(streamName: string, event: IEvent<T>) {
    await this.client.xadd(streamName, '*', event.name, JSON.stringify(event));
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

  async AddItemToQueue(key, item) {
    return new Promise((resolve, reject) => {
      this.client.rpush(`QUEUE:${key}`, item, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      })
    })
  }

  async PopQueue(key) {
    return new Promise((resolve, reject) => {
      this.client.rpop(`QUEUE:${key}`, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      })
    })
  }

  async GetItemFromQueue(key, item) {
    return new Promise((resolve, reject) => {

      this.client.lpop(`QUEUE:${key}`, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      })
    })
  }

  async GetItemFromQueueBlocking(key): Promise<[string, string] | null | undefined> {
    return new Promise((resolve, reject) => {

      this.blockingClient.blpop(`QUEUE:${key}`, 5000, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      })
    })
  }





  //item = conn.zrange('delayed:', 0, 0, withscores = True)
}


export const redisHandler = new RedisHandler();
