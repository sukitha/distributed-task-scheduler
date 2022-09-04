import { AppError } from './AppError';

export class InvalidRequestError extends AppError {
  constructor(description: string, protected statusCode = 400) {
    super('invalid_request', description);
  }
}