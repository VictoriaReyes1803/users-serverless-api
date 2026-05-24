import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import { User, CreateUserInput, UpdateUserInput, DbUserRow, PaginatedUsers } from '../types/user';

type SqlValue = string | number | boolean | null | Date;
import { ConflictError } from '../utils/errors';

function mapRowToUser(row: DbUserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export class UserRepository {
  constructor(private readonly pool: Pool) {}

  async create(input: CreateUserInput): Promise<User> {
    const id = uuidv4();
    const now = new Date();

    try {
      await this.pool.execute<ResultSetHeader>(
        'INSERT INTO users (id, name, email, phone, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, input.name, input.email, input.phone ?? null, input.role, now, now],
      );
    } catch (err: unknown) {
      const mysqlErr = err as { code?: string };
      if (mysqlErr.code === 'ER_DUP_ENTRY') {
        throw new ConflictError(`Email '${input.email}' is already registered`);
      }
      throw err;
    }

    const user = await this.findById(id);
    return user!;
  }

  async findById(id: string): Promise<User | null> {
    const [rows] = await this.pool.execute<RowDataPacket[]>(
      'SELECT id, name, email, phone, role, created_at, updated_at FROM users WHERE id = ?',
      [id],
    );

    if (rows.length === 0) return null;
    return mapRowToUser(rows[0] as DbUserRow);
  }

  async findAll(limit: number, offset: number): Promise<PaginatedUsers> {
    const [[{ total }], [rows]] = await Promise.all([
      this.pool.execute<RowDataPacket[]>('SELECT COUNT(*) as total FROM users'),
      this.pool.execute<RowDataPacket[]>(
        'SELECT id, name, email, phone, role, created_at, updated_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [limit, offset],
      ),
    ]);

    return {
      items: (rows as DbUserRow[]).map(mapRowToUser),
      limit,
      offset,
      total: (total as { total: number }).total,
    };
  }

  async update(id: string, input: UpdateUserInput): Promise<User | null> {
    const fields: string[] = [];
    const values: SqlValue[] = [];

    if (input.name !== undefined) { fields.push('name = ?'); values.push(input.name); }
    if (input.email !== undefined) { fields.push('email = ?'); values.push(input.email); }
    if (input.phone !== undefined) { fields.push('phone = ?'); values.push(input.phone ?? null); }
    if (input.role !== undefined) { fields.push('role = ?'); values.push(input.role); }

    if (fields.length === 0) return this.findById(id);

    values.push(id);

    try {
      const [result] = await this.pool.execute<ResultSetHeader>(
        `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
        values,
      );

      if (result.affectedRows === 0) return null;
    } catch (err: unknown) {
      const mysqlErr = err as { code?: string };
      if (mysqlErr.code === 'ER_DUP_ENTRY') {
        throw new ConflictError(`Email '${input.email}' is already registered`);
      }
      throw err;
    }

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const [result] = await this.pool.execute<ResultSetHeader>(
      'DELETE FROM users WHERE id = ?',
      [id],
    );
    return result.affectedRows > 0;
  }
}
