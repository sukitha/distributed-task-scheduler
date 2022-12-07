import jwt from 'jsonwebtoken';
import { Context } from 'koa';
import { IUserToken } from '../../models/IUserToken';
import UserContext from '../UserContext';

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


// jwt-decode application/json
export const tokenHandler = async (ctx: Context, next) => {
  return UserContext.getLocalStorage().run({}, async () => {
    let token = '';
    token = ctx.cookies.get('token') || token;
    token = (ctx.headers.authorization + '').split(' ')[1] || token;
    if ((!token || token === '') && next) return next();
    const user = await decode(token).catch(err => undefined) as Partial<IUserToken>;
    ctx.user = sanatizeToken(user);
    UserContext.setUserToken(ctx.user);
    UserContext.setCorrelationId(typeof ctx.request.headers['correlation-id'] === 'string' ? ctx.request.headers['correlation-id'] : '');
    return next();
  });
};

export const sanatizeToken = (user: Partial<IUserToken>) => {
  if (!user.roles || !(user.roles instanceof Array)) user.roles = [];
  return user;
}