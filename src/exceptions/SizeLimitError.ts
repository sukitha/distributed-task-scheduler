import { AppError } from './AppError';

export class SizeLimitError extends AppError {
  constructor(description: string, protected limit: number) {
    super('size_limit_reached', description, 400);
  }

  getResponse() {
    return {
      error: this.type,
      error_description: this.message,
      limit: this.limit,
      statusCode: this.statusCode
    };
  }

}