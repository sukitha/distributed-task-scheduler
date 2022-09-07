import { UnitOfWork } from 'mongo-unit-of-work';
import { getDbClient } from '../getDbClient';
import { getFactory, IUoW } from '../../repositories/RepositoryFactory';

export const unitOfWorkFactory = async (options = { useTransactions: false }, factory?: any) => {
  return <IUoW>(new UnitOfWork(await getDbClient(), factory || getFactory(), options));
};

export const getUnitOfWorkHandler = () => {
  const factory = <any>getFactory();
  return async (ctx, next) => {
    const client = await getDbClient();
    const unitOfWork = new UnitOfWork(client, factory, { useTransactions: false });
    ctx.uow = unitOfWork;
    try {
      await next();
    } finally {
      await unitOfWork.dispose();
    }
  };
};
