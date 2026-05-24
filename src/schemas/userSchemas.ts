import { z } from 'zod';

const userRoleSchema = z.enum(['admin', 'user', 'manager']);

export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(150, 'Name must be at most 150 characters'),
  email: z.string().email('Invalid email address').max(255, 'Email must be at most 255 characters'),
  phone: z
    .string()
    .max(50, 'Phone must be at most 50 characters')
    .optional()
    .nullable(),
  role: userRoleSchema,
});

export const updateUserSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(150, 'Name must be at most 150 characters')
    .optional(),
  email: z
    .string()
    .email('Invalid email address')
    .max(255, 'Email must be at most 255 characters')
    .optional(),
  phone: z
    .string()
    .max(50, 'Phone must be at most 50 characters')
    .optional()
    .nullable(),
  role: userRoleSchema.optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' },
);

export const listUsersQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 10))
    .refine((v) => v > 0 && v <= 100, { message: 'limit must be between 1 and 100' }),
  offset: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 0))
    .refine((v) => v >= 0, { message: 'offset must be >= 0' }),
});

export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid UUID format'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
