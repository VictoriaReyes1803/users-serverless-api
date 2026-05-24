import {
  AppError,
  ConflictError,
  NotFoundError,
  ValidationError,
  isAppError,
} from '../../src/utils/errors';

describe('errors', () => {
  it('creates typed application errors with status codes and details', () => {
    const appError = new AppError(418, 'Teapot', { reason: 'short and stout' });
    const notFound = new NotFoundError();
    const validation = new ValidationError('Invalid input', { field: ['Required'] });
    const conflict = new ConflictError('Duplicate');

    expect(appError.statusCode).toBe(418);
    expect(appError.details).toEqual({ reason: 'short and stout' });
    expect(notFound.statusCode).toBe(404);
    expect(notFound.message).toBe('Resource not found');
    expect(validation.statusCode).toBe(400);
    expect(validation.details).toEqual({ field: ['Required'] });
    expect(conflict.statusCode).toBe(409);
  });

  it('detects AppError instances', () => {
    expect(isAppError(new AppError(400, 'Bad'))).toBe(true);
    expect(isAppError(new Error('Nope'))).toBe(false);
  });
});
