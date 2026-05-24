import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { handler } from '../../src/handlers/deleteUser';
import * as mysqlModule from '../../src/db/mysql';

jest.mock('../../src/db/mysql');
jest.mock('mysql2/promise');

type HandlerResult = { statusCode: number; body: string };

const mockPool = { execute: jest.fn() };
const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

function makeEvent(id: string): Partial<APIGatewayProxyEventV2> {
  return { pathParameters: { id } };
}

describe('DELETE /users/{id} handler', () => {
  beforeEach(() => {
    (mysqlModule.getPool as jest.Mock).mockReturnValue(mockPool);
    mockPool.execute.mockReset();
  });

  it('returns 204 when user is deleted', async () => {
    mockPool.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const response = (await handler(makeEvent(VALID_UUID) as APIGatewayProxyEventV2)) as HandlerResult;
    expect(response.statusCode).toBe(204);
  });

  it('returns 404 when user not found', async () => {
    mockPool.execute.mockResolvedValueOnce([{ affectedRows: 0 }]);
    const response = (await handler(makeEvent(VALID_UUID) as APIGatewayProxyEventV2)) as HandlerResult;
    expect(response.statusCode).toBe(404);
  });

  it('returns 400 for invalid uuid', async () => {
    const response = (await handler(makeEvent('not-a-uuid') as APIGatewayProxyEventV2)) as HandlerResult;
    expect(response.statusCode).toBe(400);
  });
});
