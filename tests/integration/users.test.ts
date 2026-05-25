import * as dotenv from 'dotenv';
import * as path from 'path';
import { getIdToken } from './helpers/auth';

dotenv.config({ path: path.resolve(process.cwd(), '.env.integration') });

const API_URL = process.env.API_URL!.replace(/\/$/, '');

async function apiRequest(
  method: string,
  endpoint: string,
  options: { body?: unknown; token?: string | null } = {},
): Promise<{ status: number; body: unknown }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (options.token !== null) {
    const token = options.token ?? (await getIdToken());
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  let body: unknown;
  const text = await res.text();
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  return { status: res.status, body };
}

describe('Users API — integration', () => {
  let createdUserId: string;
  const uniqueEmail = `integration-test-${Date.now()}@example.com`;

  describe('POST /users', () => {
    it('creates a user and returns 201', async () => {
      const { status, body } = await apiRequest('POST', '/users', {
        body: { name: 'Integration Test', email: uniqueEmail, role: 'user' },
      });

      expect(status).toBe(201);
      const user = body as Record<string, unknown>;
      expect(user.id).toBeDefined();
      expect(user.email).toBe(uniqueEmail);
      expect(user.name).toBe('Integration Test');
      expect(user.role).toBe('user');
      createdUserId = user.id as string;
    });

    it('returns 409 for duplicate email', async () => {
      const { status, body } = await apiRequest('POST', '/users', {
        body: { name: 'Duplicate', email: uniqueEmail, role: 'user' },
      });

      expect(status).toBe(409);
      expect((body as Record<string, unknown>).error).toMatch(/already registered/i);
    });

    it('returns 400 for invalid payload', async () => {
      const { status, body } = await apiRequest('POST', '/users', {
        body: { name: '', role: 'unknown' },
      });

      expect(status).toBe(400);
      expect((body as Record<string, unknown>).error).toBeDefined();
    });

    it('returns 401 without token', async () => {
      const { status } = await apiRequest('POST', '/users', {
        token: null,
        body: { name: 'NoAuth', email: 'noauth@example.com', role: 'user' },
      });

      expect(status).toBe(401);
    });
  });

  describe('GET /users', () => {
    it('returns paginated list with 200', async () => {
      const { status, body } = await apiRequest('GET', '/users?limit=5&offset=0');

      expect(status).toBe(200);
      const result = body as Record<string, unknown>;
      expect(Array.isArray(result.items)).toBe(true);
      expect(typeof result.total).toBe('number');
      expect(typeof result.limit).toBe('number');
      expect(typeof result.offset).toBe('number');
    });

    it('returns 401 without token', async () => {
      const { status } = await apiRequest('GET', '/users', { token: null });
      expect(status).toBe(401);
    });
  });

  describe('GET /users/:id', () => {
    it('returns the created user with 200', async () => {
      const { status, body } = await apiRequest('GET', `/users/${createdUserId}`);

      expect(status).toBe(200);
      const user = body as Record<string, unknown>;
      expect(user.id).toBe(createdUserId);
      expect(user.email).toBe(uniqueEmail);
    });

    it('returns 400 for invalid UUID', async () => {
      const { status, body } = await apiRequest('GET', '/users/not-a-uuid');

      expect(status).toBe(400);
      expect((body as Record<string, unknown>).error).toBeDefined();
    });

    it('returns 401 without token', async () => {
      const { status } = await apiRequest('GET', `/users/${createdUserId}`, { token: null });
      expect(status).toBe(401);
    });
  });

  describe('PUT /users/:id', () => {
    it('updates the user and returns 200', async () => {
      const { status, body } = await apiRequest('PUT', `/users/${createdUserId}`, {
        body: { name: 'Updated Name', role: 'manager' },
      });

      expect(status).toBe(200);
      const user = body as Record<string, unknown>;
      expect(user.name).toBe('Updated Name');
      expect(user.role).toBe('manager');
    });

    it('returns 400 for empty update body', async () => {
      const { status } = await apiRequest('PUT', `/users/${createdUserId}`, { body: {} });
      expect(status).toBe(400);
    });

    it('returns 401 without token', async () => {
      const { status } = await apiRequest('PUT', `/users/${createdUserId}`, {
        token: null,
        body: { name: 'x' },
      });
      expect(status).toBe(401);
    });
  });

  describe('DELETE /users/:id', () => {
    it('deletes the user and returns 204', async () => {
      const { status } = await apiRequest('DELETE', `/users/${createdUserId}`);
      expect(status).toBe(204);
    });

    it('returns 404 after deletion', async () => {
      const { status, body } = await apiRequest('GET', `/users/${createdUserId}`);
      expect(status).toBe(404);
      expect((body as Record<string, unknown>).error).toMatch(/not found/i);
    });

    it('returns 401 without token', async () => {
      const { status } = await apiRequest('DELETE', `/users/${createdUserId}`, { token: null });
      expect(status).toBe(401);
    });
  });
});
