export const config: {
  port: number;
  production: boolean;
  mongoDbUrl: string;
  apiPrefix: string;
  redisHost: string;
  redisPort: number;
  logLevel: string;
  nodeName: string;
  appBaseUri: string;
  completedTasksTtl: number;
} = <any>{
  port: 80,
  production: false,
  appBaseUri: 'http://lvh.me',
  apiPrefix: 'api/scheduler',
  logLevel: 'trace',
  nodeName: 'scheduler-0',
  irpUri: 'http://irp/api/users',
  completedTasksTtl: 60 * 60 * 24 * 30 // 30 days
};
if (typeof process.env.APP_PORT !== 'undefined') {
  config.port = parseInt(process.env.APP_PORT);
}
if (typeof process.env.NODE_ENV !== 'undefined') {
  config.production = process.env.NODE_ENV === 'production';
}
if (typeof process.env.MONGO_DB_URL !== 'undefined') {
  config.mongoDbUrl = process.env.MONGO_DB_URL;
}

if (typeof process.env.APP_BASE_URI !== 'undefined') {
  config.appBaseUri = process.env.APP_BASE_URI;
}
if (typeof process.env.API_PREFIX !== 'undefined') {
  config.apiPrefix = process.env.API_PREFIX;
}
if (typeof process.env.REDIS_HOST !== 'undefined') {
  config.redisHost = process.env.REDIS_HOST;
}
if (typeof process.env.REDIS_PORT !== 'undefined') {
  config.redisPort = parseInt(process.env.REDIS_PORT);
}
if (typeof process.env.LOG_LEVEL !== 'undefined') {
  config.logLevel = process.env.LOG_LEVEL;
}
if (typeof process.env.NODE_NAME !== 'undefined') {
  config.nodeName = process.env.NODE_NAME;
}

console.info('Config for the app: %o', config);

let shouldExit = false;
if (!config.mongoDbUrl || config.mongoDbUrl === '') {
  console.error('Missing parameter: MONGO_DB_URL Exiting...');
  shouldExit = true;
}
if (!config.redisHost || config.redisHost === '') {
  console.error('Missing parameter: REDIS_HOST Exiting...');
  shouldExit = true;
}
if (!config.redisPort || config.redisPort === 0) {
  console.error('Missing parameter: REDIS_PORT Exiting...');
  shouldExit = true;
}
if (process.env.NODE_ENV !== 'test' && shouldExit) process.exit(1);

export default config;