export interface ApiErrorResponse {
  message: string;
  code?: string;
  field?: string;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly field?: string;

  constructor(status: number, message: string, code?: string, field?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.field = field;
  }
}

export class ConflictError extends ApiError {
  constructor(message: string = 'Выбранное время уже занято другим бронированием') {
    super(409, message, 'CONFLICT', 'start');
    this.name = 'ConflictError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, field?: string) {
    super(400, message, 'VALIDATION_ERROR', field);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Бронирование не найдено') {
    super(404, message, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}
