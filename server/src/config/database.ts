import knex, { Knex } from 'knex';

import { config } from './config';
import logger from './logger';

/**
 * Singleton Knex instance.
 * The connection configuration waits for config readiness before returning.
 */
export const db: Knex = knex({
  client: 'mysql2',
  connection: async () => {
    // Wait until config is loaded and validated
    await config.ready();

    return {
      host: config.get('DB_HOST'),
      port: config.getNumber('DB_PORT') || 3306,
      user: config.get('DB_USER'),
      password: config.get('DB_PASSWORD'),
      database: config.get('DB_NAME'),
      ssl: config.getBoolean('DB_SSL') ? { rejectUnauthorized: false } : false,
    };
  },
  pool: {
    min: 2,
    max: 10,
    idleTimeoutMillis: 30_000,
  },
});

export async function testDbConnection(): Promise<void> {
  try {
    await db.raw('SELECT 1');
    logger.info('Database connection successful.');
  } catch (error) {
    logger.error({ error: (error as Error)?.message }, 'Database connection failed');
    throw error;
  }
}
