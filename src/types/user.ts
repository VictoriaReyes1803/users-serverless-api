export type UserRole = 'admin' | 'user' | 'manager';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  age: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  age: number | null;
  phone?: string | null;
  role: UserRole;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  phone?: string | null;
  role?: UserRole;
  age?: number | null;
}

export interface ListUsersOptions {
  limit: number;
  offset: number;
}

export interface PaginatedUsers {
  items: User[];
  limit: number;
  offset: number;
  total: number;
}

export interface DbUserRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
  age: number | null;
}
