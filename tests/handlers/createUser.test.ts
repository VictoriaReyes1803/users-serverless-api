import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { handler } from '../../src/handlers/createUser';
import * as emailService from '../../src/services/emailService';
import * as mysqlModule from '../../src/db/mysql';

jest.mock('../../src/services/emailService');
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

function makeEvent(body: unknown): Partial<APIGatewayProxyEventV2> {
  return { body: JSON.stringify(body) };
}

describe('POST /users handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mysqlModule.getPool as jest.Mock).mockResolvedValue(mockPool);
    (emailService.sendUserCreatedEmail as jest.Mock).mockResolvedValue(undefined);
  });

  it('returns 201 with the created user', async () => {
    mockPool.execute.mockResolvedValueOnce([{ affectedRows: 1 }]).mockResolvedValueOnce([[dbRow]]);

    const event = makeEvent({ name: 'John Doe', email: 'john@example.com', role: 'user' });
    const response = (await handler(event as APIGatewayProxyEventV2)) as HandlerResult;

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.name).toBe('John Doe');
  });

  it('returns 400 for invalid body', async () => {
    const event = makeEvent({ name: '', email: 'bad-email', role: 'unknown' });
    const response = (await handler(event as APIGatewayProxyEventV2)) as HandlerResult;
    expect(response.statusCode).toBe(400);
  });

  it('returns 400 when body is missing required fields', async () => {
    const event = makeEvent({ name: 'John' });
    const response = (await handler(event as APIGatewayProxyEventV2)) as HandlerResult;
    expect(response.statusCode).toBe(400);
  });

  it('returns 400 when body is omitted', async () => {
    const response = (await handler({} as APIGatewayProxyEventV2)) as HandlerResult;
    expect(response.statusCode).toBe(400);
  });

  it('returns 409 when email already exists', async () => {
    mockPool.execute.mockRejectedValueOnce({ code: 'ER_DUP_ENTRY' });

    const event = makeEvent({ name: 'John Doe', email: 'john@example.com', role: 'user' });
    const response = (await handler(event as APIGatewayProxyEventV2)) as HandlerResult;

    expect(response.statusCode).toBe(409);
  });

  it('returns 500 for malformed JSON', async () => {
    const stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);

    const response = (await handler({
      body: '{bad-json',
    } as APIGatewayProxyEventV2)) as HandlerResult;

    expect(response.statusCode).toBe(500);
    stderrSpy.mockRestore();
  });
});
