import { MongoClient } from 'mongodb';
import config from '../config';
import loggerFactory from './logging';
import { Repo } from '../repositories/RepoNames';
import { TaskStatus } from '../models/ITask';


const logger = loggerFactory.getLogger('getDbClient');
let _dbClient: Promise<MongoClient> | undefined;

export const getDbClient = async () => {
  if (!_dbClient) {
    _dbClient = MongoClient.connect(config.mongoDbUrl);
    _dbClient
      .then(async result => {
        // Collections..
        const db = result.db();
        await Promise.all([
          db.createCollection(Repo.Tasks).catch(err => { })
        ]);

        await db.collection(Repo.Tasks).createIndexes([
          {
            key: { ['when']: 1 },
            expireAfterSeconds: config.completedTasksTtl,
            partialFilterExpression: { status: TaskStatus.completed }
          },
        ]);

        logger.info('Database is ready...');
        return result;
      })
      .catch(err => {
        logger.error('Database connection was not estalished...', err);
      });
  }
  return _dbClient;
};