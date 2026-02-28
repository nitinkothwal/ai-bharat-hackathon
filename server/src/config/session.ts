import session from 'express-session';
import MySQLStoreFactory from 'express-mysql-session';

import { config } from './config';

const MySQLStore = MySQLStoreFactory(session as any);

// store singleton
let sessionStore: session.Store | undefined;

export async function getSessionStore(): Promise<session.Store | undefined> {
  if (!sessionStore) {
    await config.ready();

    const options = {
      host: config.get('DB_HOST'),
      port: config.getNumber('DB_PORT') || 3306,
      user: config.get('DB_USER'),
      password: config.get('DB_PASSWORD'),
      database: config.get('DB_NAME'),
      createDatabaseTable: true, // Automatically create the sessions table if it doesn't exist
      schema: {
        tableName: 'sessions',
        columnNames: {
          session_id: 'session_id',
          expires: 'expires',
          data: 'data',
        },
      },
    };

    sessionStore = new MySQLStore(options);
  }

  // At this point, sessionStore is guaranteed to be non-null
  return sessionStore;
}
