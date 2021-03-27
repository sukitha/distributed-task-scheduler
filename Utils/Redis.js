const redis = require('ioredis');
const { config } = require('../Utils/Config');



const ip = config.get('redis.ip');
const port = config.get('redis.port');
const pass = config.get('redis.auth');
const db = config.get('redis.db');


let redisSetting = {
    port: port,
    host: ip,
    family: 4,
    password: pass,
    db: db,
    retryStrategy: function (times) {
        var delay = Math.min(times * 50, 2000);
        return delay;
    },
    reconnectOnError: function (err) {
        return true;
    }
};



module.exports.RedisHandler = class RedisHandler {
    constructor() {
        this.redisClient = new redis(redisSetting);
        this.lock = require('ioredis-lock').createLock(this.redisClient);

    }

    async AddToSortedSet(item, value) {
        return new Promise((resolve, reject) => {
            this.redisClient.zadd(`ZSET:SCHEDULED:ITEMS`, value, item, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            })
        })
    }

    async GetTopFromSortedSet() {
        return new Promise((resolve, reject) => {

            this.redisClient.zrange(`ZSET:SCHEDULED:ITEMS`, 0, 0, "WITHSCORES", (err, result) => {
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

            this.redisClient.zrem(`ZSET:SCHEDULED:ITEMS`, item, (err, result) => {
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

            this.redisClient.rpush(`QUEUE:${key}`, item, (err, result) => {
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

            this.redisClient.lpop(`QUEUE:${key}`, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            })
        })
    }

    async GetItemFromQueueBlocking(key) {
        return new Promise((resolve, reject) => {

            this.redisClient.blpop(`QUEUE:${key}`, 5000, (err, result) => {
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



