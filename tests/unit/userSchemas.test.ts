import {
  createUserSchema,
  updateUserSchema,
  listUsersQuerySchema,
  uuidParamSchema,
} from '../../src/schemas/userSchemas';

describe('createUserSchema', () => {
  it('accepts valid input', () => {
    const result = createUserSchema.safeParse({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      role: 'admin',
    });
    expect(result.success).toBe(true);
  });

  it('accepts input without optional phone', () => {
    const result = createUserSchema.safeParse({
      name: 'Jane',
      email: 'jane@example.com',
      role: 'user',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = createUserSchema.safeParse({
      name: 'John',
      email: 'not-an-email',
      role: 'user',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid role', () => {
    const result = createUserSchema.safeParse({
      name: 'John',
      email: 'john@example.com',
      role: 'superadmin',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty name', () => {
    const result = createUserSchema.safeParse({
      name: '',
      email: 'john@example.com',
      role: 'user',
    });
    expect(result.success).toBe(false);
  });
});

describe('updateUserSchema', () => {
  it('accepts partial update', () => {
    const result = updateUserSchema.safeParse({ name: 'Updated' });
    expect(result.success).toBe(true);
  });

  it('rejects empty object', () => {
    const result = updateUserSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = updateUserSchema.safeParse({ email: 'bad' });
    expect(result.success).toBe(false);
  });
});

describe('listUsersQuerySchema', () => {
  it('uses defaults when params are absent', () => {
    const result = listUsersQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(10);
      expect(result.data.offset).toBe(0);
    }
  });

  it('parses string values to numbers', () => {
    const result = listUsersQuerySchema.safeParse({ limit: '20', offset: '5' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
      expect(result.data.offset).toBe(5);
    }
  });

  it('rejects limit > 100', () => {
    const result = listUsersQuerySchema.safeParse({ limit: '101' });
    expect(result.success).toBe(false);
  });
});

describe('uuidParamSchema', () => {
  it('accepts valid uuid', () => {
    const result = uuidParamSchema.safeParse({ id: '550e8400-e29b-41d4-a716-446655440000' });
    expect(result.success).toBe(true);
  });

  it('rejects non-uuid', () => {
    const result = uuidParamSchema.safeParse({ id: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });
});
