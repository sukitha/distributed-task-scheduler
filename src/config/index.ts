export const config: {
  port: number;
  production: boolean;
  apiPrefix: string;
  redisHost: string;
  redisPort: number;
  logLevel: string;
  nodeName: string;
  appBaseUri: string;
  queueKey: string;
} = <any>{
  port: 80,
  production: false,
  appBaseUri: 'http://lvh.me',
  apiPrefix: 'api/scheduler',
  logLevel: 'trace',
  nodeName: 'scheduler-0',
  irpUri: 'http://irp/api/users',
  queueKey: 'tasks_queue'
};
if (typeof process.env.APP_PORT !== 'undefined') {
  config.port = parseInt(process.env.APP_PORT);
}
if (typeof process.env.NODE_ENV !== 'undefined') {
  config.production = process.env.NODE_ENV === 'production';
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