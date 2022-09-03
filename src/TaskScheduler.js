const { RedisHandler } = require('./Utils/Redis');
let redisHandler = new RedisHandler();
let lock = (new RedisHandler()).lock;
class TaskScheduler {

    constructor() {

    }

    async ProcessEvents() {

        while (true) {

            try {
                await lock.acquire(`LOCK:ZSET:ITEMS`);
                try {
                    let value = await redisHandler.GetTopFromSortedSet();
                    if (value && value.length > 0) {
                        let item = JSON.parse(value[0]);
                        let time = value[1];
                        if (parseFloat(time) <= Date.now()) {
                            console.log(`Scheduled item ${item[0]} ready to process`);
                            await redisHandler.DeleteItemFromSet(value[0]);
                            await redisHandler.AddItemToQueue(item[1], value[0]);
                        }

                    } else {
                        //No items to work process wait 1s before check again
                        await lock.release();
                        await new Promise(r => setTimeout(r, 1000));
                        continue;

                    }
                } catch (ex) {
                    console.log(`Error on event processing ${ex.message}`);
                }
                await lock.release();
            } catch (ex) {
                // error in acquiring or releasing the lock
            }
            await new Promise(r => setTimeout(r, 100));

        }
    }
}

module.exports.TaskScheduler = TaskScheduler;