import { v4 as uuidV4 } from 'uuid';
import { redisHandler, RedisHandler } from '../utils/redis/RedisHandler';
import { SchedulerEvents, ScheduleTaskData, Task } from '../streams/events/scheduler';
import { sleep } from '../utils/sleep';
import { unitOfWorkFactory } from '../utils/middlewares/unitOfWorkHandler';
import { IUnitOfWork } from 'mongo-unit-of-work';
import { Repo } from '../repositories/RepoNames';
import { ITask, TaskStatus } from '../models/ITask';
import { TasksRepository } from '../repositories/TasksRepository';
import loggerFactory from '../utils/logging';
import { dateConstants, getDayBoundariesMs, isToday } from '../utils/date';
import { events, R } from '../streams';
import { generateId } from '../utils/generateId';
import { IUoW } from '../repositories/RepositoryFactory';
const logger = loggerFactory.getLogger('TasksManager');

const eventTypeMap = (redis: RedisHandler) => ({
  publish_event: async (id: string, task: Task) => {
    await redis.deleteTaskAndPublish(id, task)
  }
});

export class TasksManager {
  private isDisposing = false;

  constructor(
    protected uow: IUoW,
    protected redis: RedisHandler = redisHandler
  ) { }

  get tasksRepo() {
    return this.uow.getRepository(Repo.Tasks);
  }

  stop() {
    this.isDisposing = true;
  }

  async scheduleTask(data: { id: string, when: number, task: Task }) {
    logger.info('save task', JSON.stringify(data));
    const { id, when, task } = data;
    const applicable = isToday(when);
    const result = await this.tasksRepo.create({ data: task, status: TaskStatus.scheduled, _id: id, when: new Date(when) });
    if (applicable) await this.redis.addTask(id, when, task);
    return { id, result };
  }


  async loadTasks(from: number, to: number) {
    logger.info('load task', JSON.stringify({ from, to }));

    const tasks = await this.tasksRepo.findMany({ status: TaskStatus.scheduled, when: { $gte: new Date(from), $lte: new Date(to) } });
    if (!tasks?.length) return;
    await this.redis.addManyTasks(tasks.map(t => ({ when: t.when.getTime(), id: t._id, task: t.data })));
    logger.info(`scheduled ${tasks.length} tasks`);
  }


  async updateTaskStatus(id: string, status: TaskStatus) {
    logger.info('update task status', JSON.stringify({ id, status }));

    if (status === TaskStatus.canceled) await this.redis.deleteTask(id);
    const result = await this.tasksRepo.updateStatus(id, status);
    return result;
  }


  async scheduleLoadTasksOperation(config: { id: string, executionTime: number, boundaries: { from: number, to: number } }) {
    const { id, executionTime, boundaries } = config;
    logger.info('schedule task', JSON.stringify({ executionTime, boundaries }));

    const getTask = (boundaries: { from: number, to: number }, when = executionTime): ScheduleTaskData => ({
      when,
      id,
      task: {
        type: 'publish_event',
        stream: 'scheduler_events',
        event: {
          name: SchedulerEvents.loadTasks,
          time: Date.now(),
          v: '1.0.0',
          data: boundaries,
        }
      }
    })

    await this.scheduleTask(getTask(boundaries));
  }



  async processTasks() {
    const taskHandlers = eventTypeMap(this.redis);
    while (!this.isDisposing) {
      try {
        const item = await this.redis.getTopItem();
        if (!item || item.when > Date.now()) {
          await sleep(1000);
          continue;
        }

        const { id, task } = item;

        logger.info(`processing task ${JSON.stringify(item)}`);

        const handler = taskHandlers[task.type];
        if (handler) await handler(id, task);
        else {
          logger.warn(`no handler for task, ${JSON.stringify(task)}`);
          await this.redis.deleteTask(id);
          await this.tasksRepo.deleteOne({ _id: id });
        }

      } catch (ex: any) {
        logger.error(`Error on task processing ${ex.message}`);
        await sleep(1000);
      }
    }
  }
}

export const getTasksManager = (uow: IUoW) => new TasksManager(uow);

export const startTasksManager = async () => {
  const uow = await unitOfWorkFactory();
  const tasksManager = getTasksManager(uow);

  const today = getDayBoundariesMs();
  const nextDay = getDayBoundariesMs({ daysOffset: 1 });

  await tasksManager.scheduleLoadTasksOperation({ id: 'load_tasks_now', executionTime: Date.now(), boundaries: today });
  await tasksManager.scheduleLoadTasksOperation({ id: 'load_tasks_next_day', executionTime: nextDay.from, boundaries: nextDay });

  tasksManager.processTasks();
  return {
    tasksManager,
    stop: async () => {
      tasksManager.stop();
      await uow.dispose();
    }
  }
}