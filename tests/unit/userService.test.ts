import { UserService } from '../../src/services/userService';
import { UserRepository } from '../../src/repositories/userRepository';
import * as emailService from '../../src/services/emailService';
import { NotFoundError } from '../../src/utils/errors';
import { User } from '../../src/types/user';

jest.mock('../../src/services/emailService');

const mockUser: User = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'John Doe',
  email: 'john@example.com',
  phone: null,
  role: 'user',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const mockRepo: jest.Mocked<UserRepository> = {
  create: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
} as unknown as jest.Mocked<UserRepository>;

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    service = new UserService(mockRepo);
    jest.clearAllMocks();
    (emailService.sendUserCreatedEmail as jest.Mock).mockResolvedValue(undefined);
  });

  describe('createUser', () => {
    it('creates a user and fires email notification', async () => {
      mockRepo.create.mockResolvedValueOnce(mockUser);
      const user = await service.createUser({
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
      });
      expect(user).toEqual(mockUser);
      expect(mockRepo.create).toHaveBeenCalledTimes(1);
      // Email is fire-and-forget; give it a tick to be called
      await new Promise((r) => setImmediate(r));
      expect(emailService.sendUserCreatedEmail).toHaveBeenCalledWith(mockUser);
    });

    it('logs email errors without failing user creation', async () => {
      const stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
      mockRepo.create.mockResolvedValueOnce(mockUser);
      (emailService.sendUserCreatedEmail as jest.Mock).mockRejectedValueOnce(
        new Error('SES unavailable'),
      );

      const user = await service.createUser({
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
      });

      await new Promise((r) => setImmediate(r));
      expect(user).toEqual(mockUser);
      expect(stderrSpy).toHaveBeenCalledWith(
        expect.stringContaining('[EmailService] Failed to send notification'),
      );
      stderrSpy.mockRestore();
    });
  });

  describe('getUserById', () => {
    it('returns the user when found', async () => {
      mockRepo.findById.mockResolvedValueOnce(mockUser);
      const user = await service.getUserById(mockUser.id);
      expect(user).toEqual(mockUser);
    });

    it('throws NotFoundError when user does not exist', async () => {
      mockRepo.findById.mockResolvedValueOnce(null);
      await expect(service.getUserById('non-existent')).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('listUsers', () => {
    it('delegates to repository with correct params', async () => {
      const paginated = { items: [mockUser], limit: 10, offset: 0, total: 1 };
      mockRepo.findAll.mockResolvedValueOnce(paginated);
      const result = await service.listUsers(10, 0);
      expect(result).toEqual(paginated);
      expect(mockRepo.findAll).toHaveBeenCalledWith(10, 0);
    });
  });

  describe('updateUser', () => {
    it('returns updated user', async () => {
      mockRepo.update.mockResolvedValueOnce({ ...mockUser, name: 'Updated' });
      const user = await service.updateUser(mockUser.id, { name: 'Updated' });
      expect(user.name).toBe('Updated');
    });

    it('throws NotFoundError when user does not exist', async () => {
      mockRepo.update.mockResolvedValueOnce(null);
      await expect(service.updateUser('non-existent', { name: 'x' })).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });
  });

  describe('deleteUser', () => {
    it('deletes the user successfully', async () => {
      mockRepo.delete.mockResolvedValueOnce(true);
      await expect(service.deleteUser(mockUser.id)).resolves.toBeUndefined();
    });

    it('throws NotFoundError when user does not exist', async () => {
      mockRepo.delete.mockResolvedValueOnce(false);
      await expect(service.deleteUser('non-existent')).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});
