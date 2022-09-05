import { AppError } from './AppError';
import config from '../config';

export class ServerError extends AppError {

  private _innerError?: Error;
  constructor(param: string | Error, protected statusCode = 500) {
    super('server_error', typeof param === 'string' ? param : param.message);
    if (param instanceof Error) this._innerError = param;
  }


  getResponse() {
    const body = super.getResponse();
    if (!config.production) {
      (<any>body).stack = this._innerError ? this._innerError.stack : this.stack;
    } else {
      body.error_description = 'an internal server error occurred, please try again later';
    }
    return body;
  }
}