import { IEntity, IRepository, IUnitOfWork } from 'mongo-unit-of-work';
import { MongoClient, ClientSession } from 'mongodb';
import { TasksRepository } from './TasksRepository';

import { Repo } from './RepoNames';

export const getFactory = () => {
  return function RepositoryFactory<R extends Repo>(name: string, client: MongoClient, session?: ClientSession) {
    const getRepo = repos[name];
    if (!getRepo) throw new Error(`unknown repository '${name}'`);
    return getRepo(client, session) as ReturnType<(typeof repos)[R]>
  };
};

export interface IUoW extends IUnitOfWork {
  getRepository<R extends Repo, T extends IEntity>(name: R, withTransaction?: boolean): ReturnType<(typeof repos)[R]> & IRepository<T>
}

const repos = {
  [Repo.Tasks]: (client: MongoClient, session?: ClientSession) => new TasksRepository(client.db().collection(Repo.Tasks), session)
}