import { UserRepository } from '../../src/repositories/userRepository';
import { ConflictError } from '../../src/utils/errors';
import { Pool } from 'mysql2/promise';

const mockExecute = jest.fn();
const mockPool = { execute: mockExecute } as unknown as Pool;

const now = new Date('2024-01-01T00:00:00.000Z');

const dbRow = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'John Doe',
  email: 'john@example.com',
  phone: null,
  role: 'user',
  age: 18,
  created_at: now,
  updated_at: now,
};

describe('UserRepository', () => {
  let repo: UserRepository;

  beforeEach(() => {
    repo = new UserRepository(mockPool);
    mockExecute.mockReset();
  });

  describe('findById', () => {
    it('returns a user when found', async () => {
      mockExecute.mockResolvedValueOnce([[dbRow]]);
      const user = await repo.findById(dbRow.id);
      expect(user).not.toBeNull();
      expect(user!.id).toBe(dbRow.id);
      expect(user!.createdAt).toBe(now.toISOString());
      expect(user!.age).toBe(dbRow.age);
    });

    it('returns null when not found', async () => {
      mockExecute.mockResolvedValueOnce([[]]);
      const user = await repo.findById('non-existent-id');
      expect(user).toBeNull();
    });
  });

  describe('create', () => {
    it('creates a user and returns it', async () => {
      mockExecute
        .mockResolvedValueOnce([{ affectedRows: 1 }]) // INSERT
        .mockResolvedValueOnce([[dbRow]]); // SELECT after insert
      const user = await repo.create({
        name: 'John Doe',
        email: 'john@example.com',
        age: 18,
        role: 'user',
      });
      expect(user.name).toBe('John Doe');
      expect(user.age).toBe(18);
    });

    it('passes phone when creating a user with phone', async () => {
      mockExecute
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([[{ ...dbRow, phone: '+1234567890' }]]);

      await repo.create({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        role: 'user',
        age: 18,
      });

      expect(mockExecute.mock.calls[0][1]).toEqual(
        expect.arrayContaining(['John Doe', 'john@example.com', '+1234567890', 18, 'user']),
      );
    });

    it('throws ConflictError on duplicate email', async () => {
      mockExecute.mockRejectedValueOnce({ code: 'ER_DUP_ENTRY' });
      await expect(
        repo.create({ name: 'John', email: 'john@example.com', role: 'user', age: 18 }),
      ).rejects.toBeInstanceOf(ConflictError);
    });

    it('rethrows non-duplicate create errors', async () => {
      mockExecute.mockRejectedValueOnce(new Error('connection lost'));

      await expect(
        repo.create({ name: 'John', email: 'john@example.com', role: 'user', age: 18 }),
      ).rejects.toThrow('connection lost');
    });
  });

  describe('findAll', () => {
    it('returns paginated users', async () => {
      mockExecute.mockResolvedValueOnce([[{ total: 1 }]]).mockResolvedValueOnce([[dbRow]]);
      const result = await repo.findAll(10, 0);
      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);
    });
  });

  describe('update', () => {
    it('returns updated user', async () => {
      mockExecute
        .mockResolvedValueOnce([{ affectedRows: 1 }]) // UPDATE
        .mockResolvedValueOnce([[dbRow]]); // SELECT
      const user = await repo.update(dbRow.id, { name: 'Updated' });
      expect(user).not.toBeNull();
    });

    it('updates email, phone, and role fields', async () => {
      mockExecute
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([
          [{ ...dbRow, email: 'new@example.com', phone: '+1', role: 'admin', age: 18 }],
        ]);

      const user = await repo.update(dbRow.id, {
        email: 'new@example.com',
        phone: '+1',
        age: 18,
        role: 'admin',
      });

      expect(mockExecute.mock.calls[0][0]).toContain('email = ?');
      expect(mockExecute.mock.calls[0][0]).toContain('phone = ?');
      expect(mockExecute.mock.calls[0][0]).toContain('age = ?');
      expect(mockExecute.mock.calls[0][0]).toContain('role = ?');
      expect(user).not.toBeNull();
    });

    it('updates phone to null', async () => {
      mockExecute.mockResolvedValueOnce([{ affectedRows: 1 }]).mockResolvedValueOnce([[dbRow]]);

      await repo.update(dbRow.id, { phone: null });

      expect(mockExecute.mock.calls[0][1]).toEqual([null, dbRow.id]);
    });

    it('returns existing user when no update fields are provided', async () => {
      mockExecute.mockResolvedValueOnce([[dbRow]]);

      const user = await repo.update(dbRow.id, {});

      expect(user).not.toBeNull();
      expect(mockExecute).toHaveBeenCalledTimes(1);
    });

    it('returns null when user not found', async () => {
      mockExecute.mockResolvedValueOnce([{ affectedRows: 0 }]);
      const user = await repo.update('non-existent', { name: 'Updated' });
      expect(user).toBeNull();
    });

    it('throws ConflictError on duplicate email update', async () => {
      mockExecute.mockRejectedValueOnce({ code: 'ER_DUP_ENTRY' });

      await expect(repo.update(dbRow.id, { email: 'john@example.com' })).rejects.toBeInstanceOf(
        ConflictError,
      );
    });

    it('rethrows non-duplicate update errors', async () => {
      mockExecute.mockRejectedValueOnce(new Error('connection lost'));

      await expect(repo.update(dbRow.id, { email: 'john@example.com' })).rejects.toThrow(
        'connection lost',
      );
    });
  });

  describe('delete', () => {
    it('returns true when deleted', async () => {
      mockExecute.mockResolvedValueOnce([{ affectedRows: 1 }]);
      const deleted = await repo.delete(dbRow.id);
      expect(deleted).toBe(true);
    });

    it('returns false when not found', async () => {
      mockExecute.mockResolvedValueOnce([{ affectedRows: 0 }]);
      const deleted = await repo.delete('non-existent');
      expect(deleted).toBe(false);
    });
  });
});
