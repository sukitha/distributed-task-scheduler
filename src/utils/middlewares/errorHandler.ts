import { Context } from 'koa';
import { SizeLimitError } from '../../exceptions';
import { AppError } from '../../exceptions/AppError';
import { ServerError } from '../../exceptions/ServerError';
import config from '../../config';

export const respondeWithError = (ctx: Context, err: any) => {
  if (err instanceof AppError) {
    ctx.type = 'json';
    ctx.body = err.getResponse();
    ctx.status = err.getStatusCode();
  } else {
    const serverError = new ServerError(err, 500);
    ctx.type = 'json';
    ctx.body = serverError.getResponse();
    ctx.status = serverError.getStatusCode();
  }
  ctx.app.emit('error', err, ctx);
};

export const errorHandler = (ctx, next) => next().catch(err => respondeWithError(ctx, err));