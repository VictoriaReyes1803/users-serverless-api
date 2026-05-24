-- Migration: 001_create_users_table
-- Description: Creates the initial users table

CREATE TABLE IF NOT EXISTS users (
  id         CHAR(36)                         NOT NULL,
  name       VARCHAR(150)                     NOT NULL,
  email      VARCHAR(255)                     NOT NULL,
  phone      VARCHAR(50)                      NULL,
  role       ENUM('admin', 'user', 'manager') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP                        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP                        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  INDEX idx_users_role (role),
  INDEX idx_users_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
