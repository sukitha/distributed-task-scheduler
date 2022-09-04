import { Context } from 'koa';

export const removeNginxSlashes = async (ctx: Context, next) => {
  if (ctx.request.url.startsWith('//')) {
    ctx.request.url = ctx.request.url.substring(1);
  }
  return next();
}