import { Repo } from './RepoNames';
import { Collection, ClientSession } from 'mongodb';
import { AuditableRepository } from 'mongo-unit-of-work';
import UserContext from '../utils/UserContext';
import { ITask, TaskStatus } from '../models/ITask';

export class TasksRepository extends AuditableRepository<ITask> {
  constructor(collection: Collection<ITask>, session?: ClientSession) {
    super(Repo.Tasks, collection, session, {
      getCurrentTime: () => new Date(),
      getUserId: () => UserContext.getUserToken()?.sub || 'unknown',
      softDelete: false
    })
  }

  async create(entity: ITask) {
    const result = await this.add({ ...entity });
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