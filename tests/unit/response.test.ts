import {
  badRequest,
  created,
  errorResponse,
  internalError,
  noContent,
  notFound,
  success,
  unauthorized,
} from '../../src/utils/response';

type JsonResponse = {
  statusCode: number;
  body: string;
};

function asJsonResponse(response: unknown): JsonResponse {
  return response as JsonResponse;
}

function parseBody(response: unknown) {
  return JSON.parse(asJsonResponse(response).body);
}

describe('response helpers', () => {
  it('builds success responses with default and custom status codes', () => {
    expect(asJsonResponse(success({ ok: true })).statusCode).toBe(200);
    expect(asJsonResponse(success({ ok: true }, 202)).statusCode).toBe(202);
    expect(asJsonResponse(created({ id: '1' })).statusCode).toBe(201);
  });

  it('builds no-content responses', () => {
    const response = asJsonResponse(noContent());
    expect(response.statusCode).toBe(204);
    expect(response.body).toBe('');
  });

  it('builds error responses with and without details', () => {
    expect(parseBody(errorResponse(409, 'Conflict'))).toEqual({ error: 'Conflict' });
    expect(parseBody(badRequest('Validation failed', { name: ['Required'] }))).toEqual({
      error: 'Validation failed',
      details: { name: ['Required'] },
    });
  });

  it('builds standard auth, not-found, and internal-error responses', () => {
    expect(parseBody(unauthorized())).toEqual({ error: 'Unauthorized' });
    expect(parseBody(unauthorized('Token expired'))).toEqual({ error: 'Token expired' });
    expect(parseBody(notFound())).toEqual({ error: 'Resource not found' });
    expect(parseBody(notFound('Missing'))).toEqual({ error: 'Missing' });
    expect(parseBody(internalError())).toEqual({ error: 'Internal server error' });
    expect(parseBody(internalError('Boom'))).toEqual({ error: 'Boom' });
  });
});
