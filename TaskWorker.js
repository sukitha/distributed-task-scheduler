const { RedisHandler } = require('./Utils/Redis');
let redisHandler = new RedisHandler();

class TaskWorker {
    constructor() { }

    async ProcessTasks(queue) {

        while (true) {

            let taskArray = await redisHandler.GetItemFromQueueBlocking(queue);
            if (taskArray && taskArray.length > 1) {
                let task = JSON.parse(taskArray[1]);
                if (task && Array.isArray(task) && task.length > 2) {
                    let item = task[2];
                    console.log(`Task ${task[0]} ready to process - action: ${item.action} params: ${item.time}`);
                    await new Promise(r => setTimeout(r, item.time));
                }
            }
        }

    }
}

module.exports.TaskWorker = TaskWorker;