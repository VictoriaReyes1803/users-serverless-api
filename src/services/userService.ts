import { UserRepository } from '../repositories/userRepository';
import { sendUserCreatedEmail } from './emailService';
import { User, PaginatedUsers, CreateUserInput, UpdateUserInput } from '../types/user';
import { NotFoundError } from '../utils/errors';

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async createUser(input: CreateUserInput): Promise<User> {
    const user = await this.userRepository.create(input);

    try {
      await sendUserCreatedEmail(user);
    } catch (err) {
      process.stderr.write(`[EmailService] Failed to send notification: ${String(err)}\n`);
    }

    return user;
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundError(`User with id '${id}' not found`);
    return user;
  }

  async listUsers(limit: number, offset: number): Promise<PaginatedUsers> {
    return this.userRepository.findAll(limit, offset);
  }

  async updateUser(id: string, input: UpdateUserInput): Promise<User> {
    const user = await this.userRepository.update(id, input);
    if (!user) throw new NotFoundError(`User with id '${id}' not found`);
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    const deleted = await this.userRepository.delete(id);
    if (!deleted) throw new NotFoundError(`User with id '${id}' not found`);
  }
}
