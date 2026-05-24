import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { handler } from '../../src/handlers/getUser';
import * as mysqlModule from '../../src/db/mysql';

jest.mock('../../src/db/mysql');
jest.mock('mysql2/promise');

type HandlerResult = { statusCode: number; body: string };

const mockPool = { execute: jest.fn() };

const now = new Date('2024-01-01T00:00:00.000Z');
const dbRow = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'John Doe',
  email: 'john@example.com',
  phone: null,
  role: 'user',
  created_at: now,
  updated_at: now,
};

function makeEvent(id: string): Partial<APIGatewayProxyEventV2> {
  return { pathParameters: { id } };
}

describe('GET /users/{id} handler', () => {
  beforeEach(() => {
    (mysqlModule.getPool as jest.Mock).mockReturnValue(mockPool);
    mockPool.execute.mockReset();
  });

  it('returns 200 with the user when found', async () => {
    mockPool.execute.mockResolvedValueOnce([[dbRow]]);
    const response = (await handler(
      makeEvent(dbRow.id) as APIGatewayProxyEventV2,
    )) as HandlerResult;
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.id).toBe(dbRow.id);
  });

  it('returns 404 when user not found', async () => {
    mockPool.execute.mockResolvedValueOnce([[]]);
    const response = (await handler(
      makeEvent(dbRow.id) as APIGatewayProxyEventV2,
    )) as HandlerResult;
    expect(response.statusCode).toBe(404);
  });

  it('returns 400 for invalid uuid', async () => {
    const response = (await handler(
      makeEvent('not-a-uuid') as APIGatewayProxyEventV2,
    )) as HandlerResult;
    expect(response.statusCode).toBe(400);
  });

  it('returns 500 for unexpected repository errors', async () => {
    const stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
    mockPool.execute.mockRejectedValueOnce(new Error('database offline'));

    const response = (await handler(
      makeEvent(dbRow.id) as APIGatewayProxyEventV2,
    )) as HandlerResult;

    expect(response.statusCode).toBe(500);
    stderrSpy.mockRestore();
  });
});
