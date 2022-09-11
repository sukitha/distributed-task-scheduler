import { Repo } from './RepoNames';
import { Collection, ClientSession } from 'mongodb';
import { AuditableRepository } from 'mongo-unit-of-work';
import UserContext from '../utils/UserContext';
import { ITask, TaskStatus } from '../models/ITask';
import { Task } from '../streams/events/scheduler';
import { dateConstants, getDayBoundariesMs } from '../utils/date';
import loggerFactory from '../utils/logging';

const logger = loggerFactory.getLogger('TasksRepository');

export class TasksRepository extends AuditableRepository<ITask> {
  constructor(collection: Collection<ITask>, session?: ClientSession) {
    super(Repo.Tasks, collection, session, {
      getCurrentTime: () => new Date(),
      getUserId: () => UserContext.getUserToken()?.sub || 'unknown',
      softDelete: false
    })
  }

  async create(
    _id: string,
    task: {
      data: Task;
      when: Date;
      status: TaskStatus;
    }) {
    const result = await this.findOneAndUpdate(
      { _id },
      {
        $setOnInsert: { _id },
        $set: { ...task }
      },
      { upsert: true }
    );
    return result;
  }

  async updateToNextDay(_id: string, baseDateMs: number) {
    const nextDay = getDayBoundariesMs({ daysOffset: 1, baseDateMs });
    const when = new Date(nextDay.from);
    const result = await this.findOneAndUpdate(
      { _id },
      {
        $set: {
          when,
          //@ts-ignore
          'data.event.data.from': nextDay.from,
          'data.event.data.to': nextDay.to,
        }
      },
      { returnDocument: 'after' }
    )
    return result;
  }

  async updateStatus(_id: string, status: TaskStatus) {
    const result = await this.findOneAndUpdate(
      { _id },
      { $set: { status } },
      { returnDocument: 'after' }
    );

    return result!;
  }
}