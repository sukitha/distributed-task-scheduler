
import { IUserToken } from '../models/IUserToken';

import { AsyncLocalStorage } from 'async_hooks';
const asyncLocalStorage = new AsyncLocalStorage<{
  correlationId?: string;
  token?: IUserToken;
  locale?: string;
}>();
class UserContext {
  getCorrelationId(): string | undefined {
    return asyncLocalStorage.getStore()?.correlationId;
  }
  getUserToken(): IUserToken | undefined {
    return asyncLocalStorage.getStore()?.token
  }
  setUserToken(token: IUserToken) {
    const store = asyncLocalStorage.getStore();
    if (store) store.token = token;
  }
  setCorrelationId(correlationId: string) {
    const store = asyncLocalStorage.getStore();
    if (store) store.correlationId = correlationId;
  }
  getLocale(): string {
    return asyncLocalStorage.getStore()?.locale || 'en';
  }
  setLocale(locale: string) {
    const store = asyncLocalStorage.getStore();
    if (store) store.locale = locale;
  }
  getErrorContext() {
    const token = this.getUserToken();
    return {
      userId: token?.sub,
      roles: token?.roles,
      correlationId: this.getCorrelationId(),
    }
  }
  getLocalStorage() {
    return asyncLocalStorage;
  }
}
export default new UserContext();