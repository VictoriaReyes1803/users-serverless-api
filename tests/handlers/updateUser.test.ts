import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { handler } from '../../src/handlers/updateUser';
import * as mysqlModule from '../../src/db/mysql';

jest.mock('../../src/db/mysql');
jest.mock('mysql2/promise');

type HandlerResult = { statusCode: number; body: string };

const mockPool = { execute: jest.fn() };
const now = new Date('2024-01-01T00:00:00.000Z');
const dbRow = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Updated Name',
  email: 'john@example.com',
  phone: null,
  role: 'user',
  created_at: now,
  updated_at: now,
};

function makeEvent(id: string, body: unknown): Partial<APIGatewayProxyEventV2> {
  return { pathParameters: { id }, body: JSON.stringify(body) };
}

describe('PUT /users/{id} handler', () => {
  beforeEach(() => {
    (mysqlModule.getPool as jest.Mock).mockReturnValue(mockPool);
    mockPool.execute.mockReset();
  });

  it('returns 200 with the updated user', async () => {
    mockPool.execute.mockResolvedValueOnce([{ affectedRows: 1 }]).mockResolvedValueOnce([[dbRow]]);
    const response = (await handler(
      makeEvent(dbRow.id, { name: 'Updated Name' }) as APIGatewayProxyEventV2,
    )) as HandlerResult;
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.name).toBe('Updated Name');
  });

  it('returns 404 when user not found', async () => {
    mockPool.execute.mockResolvedValueOnce([{ affectedRows: 0 }]);
    const response = (await handler(
      makeEvent(dbRow.id, { name: 'Updated' }) as APIGatewayProxyEventV2,
    )) as HandlerResult;
    expect(response.statusCode).toBe(404);
  });

  it('returns 400 for empty update body', async () => {
    const response = (await handler(
      makeEvent(dbRow.id, {}) as APIGatewayProxyEventV2,
    )) as HandlerResult;
    expect(response.statusCode).toBe(400);
  });

  it('returns 400 for invalid uuid', async () => {
    const response = (await handler(
      makeEvent('bad-id', { name: 'x' }) as APIGatewayProxyEventV2,
    )) as HandlerResult;
    expect(response.statusCode).toBe(400);
  });

  it('returns 400 when body is omitted', async () => {
    const response = (await handler({
      pathParameters: { id: dbRow.id },
    } as unknown as APIGatewayProxyEventV2)) as HandlerResult;

    expect(response.statusCode).toBe(400);
  });

  it('returns 500 for malformed JSON', async () => {
    const stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);

    const response = (await handler({
      pathParameters: { id: dbRow.id },
      body: '{bad-json',
    } as unknown as APIGatewayProxyEventV2)) as HandlerResult;

    expect(response.statusCode).toBe(500);
    stderrSpy.mockRestore();
  });
});
