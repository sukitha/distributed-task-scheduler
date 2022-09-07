import { R } from '.';
import { getTasksManager } from '../services/TasksManager';
import { SchedulerEvents } from './events/scheduler';
import loggerFactory from '../utils/logging';
import { unitOfWorkFactory } from '../utils/middlewares/unitOfWorkHandler';

const logger = loggerFactory.getLogger('SchedulerStream');


const setup = (streams = R) => {

  const stream = streams.scheduler;

  stream.handle(SchedulerEvents.scheduleTask, async (id, event) => {
    logger.trace(JSON.stringify(event));
    const uow = await unitOfWorkFactory();
    try {
      const taskManager = getTasksManager(uow);
      const valueParsed = event.data;
      await taskManager.scheduleTask(valueParsed);
    } finally {
      await uow.dispose();
    }
  });

  stream.handle(SchedulerEvents.cancelTask, async (id, event) => {
    logger.trace(JSON.stringify(event));
    const uow = await unitOfWorkFactory();
    try {
      const taskManager = getTasksManager(uow);
      const valueParsed = event.data;
      await taskManager.updateTaskStatus(valueParsed.id, valueParsed.status);
    } finally {
      await uow.dispose();
    }
  });

  stream.handle(SchedulerEvents.failTask, async (id, event) => {
    logger.trace(JSON.stringify(event));
    const uow = await unitOfWorkFactory();
    try {
      const taskManager = getTasksManager(uow);
      const valueParsed = event.data;
      await taskManager.updateTaskStatus(valueParsed.id, valueParsed.status);
    } finally {
      await uow.dispose();
    }
  });

  stream.handle(SchedulerEvents.completeTask, async (id, event) => {
    logger.trace(JSON.stringify(event));
    const uow = await unitOfWorkFactory();
    try {
      const taskManager = getTasksManager(uow);
      const valueParsed = event.data;
      await taskManager.updateTaskStatus(valueParsed.id, valueParsed.status);
    } finally {
      await uow.dispose();
    }
  });


  stream.handle(SchedulerEvents.loadTasks, async (id, event) => {
    logger.trace(JSON.stringify(event));
    const uow = await unitOfWorkFactory();
    try {
      const taskManager = getTasksManager(uow);
      const valueParsed = event.data;
      const { from, to } = valueParsed;
      await taskManager.loadTasks(from, to);
    } finally {
      await uow.dispose();
    }
  });

  return stream.consume();
}

export const startSchedulerStream = async (streams = R) => {
  return setup(streams);
};


// mock event
// XADD scheduler_events MAXLEN ~ 100000 * createSchedulerTask '{"data":{"when": 1662314479009, "task": { "stream": "invoices_events", "type": "publish_event", "event": {"name": "some event","v": "1.0.0", "data": { "hi": 1 }}} }}'
