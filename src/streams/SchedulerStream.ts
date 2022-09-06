import { R } from '.';
import { taskManager } from '../services/TasksManager';
import { SchedulerEvents } from './events/scheduler';
import loggerFactory from '../utils/logging';

const logger = loggerFactory.getLogger('SchedulerStream');



const setup = (streams = R) => {

  const stream = streams.scheduler;

  stream.handle(SchedulerEvents.createSchedulerTask, async (id, event) => {
    logger.trace(JSON.stringify(event));
    const valueParsed = event.data;
    await taskManager.saveTask(valueParsed.when, valueParsed.task);
  });

  return stream.consume();
}

export const startSchedulerStream = async (streams = R) => {
  return setup(streams);
};


// mock event
// XADD scheduler_events MAXLEN ~ 100000 * createSchedulerTask '{"data":{"when": 1662314479009, "task": { "stream": "invoices_events", "type": "publish_event", "event": {"name": "some event","v": "1.0.0", "data": { "hi": 1 }}} }}'
