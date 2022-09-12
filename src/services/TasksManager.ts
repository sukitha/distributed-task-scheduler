import { redisHandler, RedisHandler } from '../utils/redis/RedisHandler';
import { SchedulerEvents, Task } from '../streams/events/scheduler';
import { sleep } from '../utils/sleep';
import { unitOfWorkFactory } from '../utils/middlewares/unitOfWorkHandler';
import { Repo } from '../repositories/RepoNames';
import { TaskStatus } from '../models/ITask';

import loggerFactory from '../utils/logging';
import { getDayBoundariesMs, isToday } from '../utils/date';
import { IUoW } from '../repositories/RepositoryFactory';
import { InvalidRequestError } from '../exceptions';
const logger = loggerFactory.getLogger('TasksManager');

export class TasksManager {
  private handlers = {
    publish_event: async (id: string, task: Task) => {
      await this.redis.deleteTaskAndPublish(id, task);
      await this.updateTaskStatus(id, TaskStatus.processed);
    }
  }

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
    const { id, when, task } = data;
    if (!id) throw new InvalidRequestError('id is not provided');
    if (typeof when !== 'number') throw new InvalidRequestError('when is not provided');
    const isApplicable = isToday(when);
    logger.info('scheduleTask', JSON.stringify({ ...data, isApplicable }));
    const result = await this.tasksRepo.create(id, { data: task, status: TaskStatus.scheduled, when: new Date(when) });
    if (isApplicable) await this.redis.addTask(id, when, task);

    return { id, result };
  }

  async loadTasks(from: number, to: number) {
    logger.info('loadTasks', JSON.stringify({ from, to }));
    const tasks = await this.tasksRepo.findMany({
      status: TaskStatus.scheduled,
      when: { $gte: new Date(from), $lte: new Date(to) }
    });
    if (!tasks?.length) return;

    const nextDayKey = 'load_tasks_next_day';
    const nextDay = tasks.find(t => t._id === nextDayKey);
    if (nextDay) await this.tasksRepo.updateToNextDay(nextDay._id, nextDay.when.getTime());

    logger.info('loaded tasks', JSON.stringify(tasks));
    await this.redis.addManyTasks(tasks.map(t => ({ when: new Date(t.when).getTime(), id: t._id, task: t.data })));
    const { length } = tasks;
    logger.info(`scheduled ${length} task${length > 1 ? 's' : ''}`);
  }

  async updateTaskStatus(id: string, status: TaskStatus) {
    logger.info('updateTaskStatus', JSON.stringify({ id, status }));
    if (status === TaskStatus.canceled) await this.redis.deleteTask(id);
    const result = await this.tasksRepo.updateStatus(id, status);
    return result;
  }

  async scheduleLoadTasksOperation(config: { id: string, executionTime: number, boundaries: { from: number, to: number } }) {
    const { id, executionTime, boundaries } = config;
    logger.info('scheduleLoadTasksOperation', JSON.stringify({ id, executionTime, boundaries }));

    await this.redis.addTask(id, executionTime, {
      type: 'publish_event',
      stream: 'scheduler_events',
      event: {
        name: SchedulerEvents.loadTasks,
        time: Date.now(),
        v: '1.0.0',
        data: boundaries,
      }
    });
  }

  async processTasks() {
    while (!this.isDisposing) {
      try {
        const item = await this.redis.getTopItem();
        if (!item || item.when > Date.now()) {
          await sleep(1000);
          continue;
        }

        const { id, task } = item;

        const handler = this.handlers[task.type];
        if (handler) await handler(id, task);
        else {
          logger.warn(`no handler for task: ${JSON.stringify(task)}`);
          await Promise.all([
            this.redis.deleteTask(id),
            this.tasksRepo.deleteOne({ _id: id })
          ]);
        }
      } catch (ex: any) {
        logger.error(`Error on task processing ${JSON.stringify(ex)}`);
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