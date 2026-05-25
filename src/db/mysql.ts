import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import mysql from 'mysql2/promise';

interface RdsSecret {
  username: string;
  password: string;
  host: string;
  port: number;
}

const smClient = new SecretsManagerClient({});
let pool: mysql.Pool | null = null;

async function fetchDbCredentials(): Promise<RdsSecret> {
  const { SecretString } = await smClient.send(
    new GetSecretValueCommand({ SecretId: process.env.DB_SECRET_ARN! }),
  );
  return JSON.parse(SecretString!) as RdsSecret;
}

export async function getPool(): Promise<mysql.Pool> {
  if (!pool) {
    const secret = await fetchDbCredentials();
    pool = mysql.createPool({
      host: secret.host,
      port: secret.port,
      database: process.env.DB_NAME,
      user: secret.username,
      password: secret.password,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      // Reuse connections across Lambda invocations when the execution context is warm
      idleTimeout: 60000,
      connectTimeout: 10000,
    });
  }
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
