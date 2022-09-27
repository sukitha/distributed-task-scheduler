import jwt from 'jsonwebtoken';
import { Context } from 'koa';
import { createNamespace } from 'continuation-local-storage';
import { IUserToken } from '../../models/IUserToken';

const decode = (token) => {
  return new Promise((resolve, reject) => {
    try {
      const decoded = jwt.decode(token);
      return resolve(decoded);
    } catch (err) {
      return reject(err);
    }
  });
};

const usersNamespace = createNamespace('user');

// jwt-decode application/json
export const tokenHandler = async (ctx: Context, next) => {
  let token = '';
  token = ctx.cookies.get('token') || token;
  token = (ctx.headers.authorization + '').split(' ')[1] || token;
  if ((!token || token === '') && next) return next();
  const user = await decode(token).catch(err => undefined) as Partial<IUserToken>;
  ctx.user = sanatizeToken(user);

  const context = usersNamespace.createContext();
  try {
    // tslint:disable-next-line:no-string-literal
    usersNamespace['enter'](context);
    usersNamespace.set('token', ctx.user);
    usersNamespace.set('correlationId', ctx.request.headers['correlation-id']);
    await next();
  } finally {
    // tslint:disable-next-line:no-string-literal
    usersNamespace['exit'](context);
  }
};

export const sanatizeToken = (user: Partial<IUserToken>) => {
  if (!user.roles || !(user.roles instanceof Array)) user.roles = [];
  return user;
}