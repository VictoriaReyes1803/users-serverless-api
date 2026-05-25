import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { getPool } from '../db/mysql';

const MIGRATION_SQL = `
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
`;

export const handler = async (): Promise<APIGatewayProxyResultV2> => {
  const pool = await getPool();

  try {
    await pool.execute(MIGRATION_SQL);

    const [rows] = await pool.execute<never[]>('SHOW TABLES LIKE "users"');
    const tableExists = rows.length > 0;

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: tableExists
          ? 'Migration applied: users table is ready.'
          : 'Migration ran but table not found.',
      }),
    };
  } catch (err) {
    process.stderr.write(`[migrate] Error: ${String(err)}\n`);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: String(err),
      }),
    };
  } finally {
    await pool.end();
  }
};
