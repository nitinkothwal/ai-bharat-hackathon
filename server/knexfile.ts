import type { Knex } from 'knex';
import dotenv from 'dotenv';

dotenv.config(); // load environment variables

const knexConfig: { [key: string]: Knex.Config } = {
  development: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    },
    migrations: {
      directory: './src/database/migrations',
    },
  },
  production: {
    client: 'mysql2',
    connection: process.env.DATABASE_URL, // e.g., mysql://user:password@host:port/db
    migrations: {
      directory: './src/database/migrations',
    },
  },
};

export default knexConfig;
