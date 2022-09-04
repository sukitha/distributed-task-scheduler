
import { getNamespace } from 'continuation-local-storage';
import { IUserToken } from '../models/IUserToken';

class CorrelationIDHelper {
  getCorrelationId(): string | undefined {
    const namespace = getNamespace('user');
    return namespace && namespace.get('correlationId') || undefined;
  }

  getUserToken(): IUserToken | undefined {
    const namespace = getNamespace('user');
    return namespace && namespace.get('token') || undefined;
  }

  getUserLocale(): string {
    const namespace = getNamespace('user');
    return namespace && namespace.get('locale') || 'en';
  }
}
export default new CorrelationIDHelper();