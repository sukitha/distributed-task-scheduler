import { AppError } from './AppError';

export class NotFoundError extends AppError {
  constructor(description = 'the resource you are requesting does not exist') {
    super('not_found', description, 404);
  }
}