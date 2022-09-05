import { ValidationError as FastestValidationError } from 'fastest-validator';
import { AppError } from './AppError';

export class ValidationError extends AppError {
  constructor(protected validations: FastestValidationError[], protected statusCode = 400) {
    super('invalid_request', 'validation errors');
  }

  getResponse() {
    return Object.assign(super.getResponse(), {
      validations: this.validations
    });
  }
}