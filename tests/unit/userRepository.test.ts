import { UserRepository } from '../../src/repositories/userRepository';
import { ConflictError } from '../../src/utils/errors';

const mockExecute = jest.fn();
const mockPool = { execute: mockExecute } as any;

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
      const user = await repo.create({ name: 'John Doe', email: 'john@example.com', role: 'user' });
      expect(user.name).toBe('John Doe');
    });

    it('throws ConflictError on duplicate email', async () => {
      mockExecute.mockRejectedValueOnce({ code: 'ER_DUP_ENTRY' });
      await expect(repo.create({ name: 'John', email: 'john@example.com', role: 'user' })).rejects.toBeInstanceOf(ConflictError);
    });
  });

  describe('findAll', () => {
    it('returns paginated users', async () => {
      mockExecute
        .mockResolvedValueOnce([[{ total: 1 }]])
        .mockResolvedValueOnce([[dbRow]]);
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

    it('returns null when user not found', async () => {
      mockExecute.mockResolvedValueOnce([{ affectedRows: 0 }]);
      const user = await repo.update('non-existent', { name: 'Updated' });
      expect(user).toBeNull();
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
