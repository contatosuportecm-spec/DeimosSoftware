import { Pool, PoolConfig } from 'pg';
import { logger } from '../utils/logger';

let pool: Pool | null = null;

/** Retorna o Pool singleton. Cria na primeira chamada. */
export function getPool(): Pool {
  if (pool) return pool;

  const config: PoolConfig = buildConfig();
  pool = new Pool(config);

  pool.on('error', (err) => {
    logger.error('Erro inesperado no pool PostgreSQL', { message: err.message });
  });

  return pool;
}

function buildConfig(): PoolConfig {
  // Prioridade 1: DATABASE_URL
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    };
  }

  // Prioridade 2: variáveis individuais
  const host     = process.env.DB_HOST     ?? 'localhost';
  const port     = parseInt(process.env.DB_PORT ?? '5432', 10);
  const database = process.env.DB_NAME     ?? 'deimos';
  const user     = process.env.DB_USER     ?? 'postgres';
  const password = process.env.DB_PASSWORD ?? '';

  return {
    host,
    port,
    database,
    user,
    password,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  };
}

/** Encerra o pool — chamar ao final do processo */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
