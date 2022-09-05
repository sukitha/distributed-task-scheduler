import { ServerError } from '../../exceptions';

export const healthCheckHandler = (serverStatus: { live: boolean; ready: boolean }) => async (ctx, next) => {
  if (ctx.method === 'GET' && ctx.url === `/healthcheck`) {
    if (serverStatus.live && serverStatus.ready) {
      ctx.body = 'OK';
      ctx.status = 200;
    } else {
      const err = new ServerError('service is not ready', 503);
      ctx.body = err.getResponse();
      ctx.status = err.getStatusCode();
    }
  } else {
    await next();
  }
};