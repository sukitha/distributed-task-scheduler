const { v4: uuidV4 } = require('uuid');
const { RedisHandler } = require('./Utils/Redis');
let redisHandler = new RedisHandler();
class TaskAPI {
  constructor() { }

  async SaveTask(req, res, next) {
    let queue = req.params.queue;
    let id = uuidV4();
    let time = req.body.when;
    let item = [id, queue, req.body.task];
    let score = 0;
    let status = 'PENDING';
    if (time) {
      score = new Date(time).getTime()
      console.log(`Push task ${id} to process later on ${time} `);
      await redisHandler.AddToSortedSet(JSON.stringify(item), score);
      status = 'SCHEDULED';

    } else {
      console.log(`Push task ${id} to execute in realtime`);
      await redisHandler.AddItemToQueue(queue, JSON.stringify(item));
      status = 'QUEUED';
    }
    res.send({ item: item, score: score, status: status });
  }
}

module.exports.TaskAPI = TaskAPI;
