import 'dotenv/config';

import { app } from './app';
import { db, testDbConnection } from './config/database';
import logger from './config/logger';
import { config } from './config/config';
import { validateConfigOnce } from './config/validate-config';

let server: ReturnType<typeof app.listen> | null = null;

// Graceful shutdown state
let shuttingDown = false;
let shutdownPromise: Promise<void> | null = null;

// Application bootstrap
async function bootstrap(): Promise<void> {
  try {
    await config.load();
    validateConfigOnce();
    await testDbConnection();

    const port = config.getNumber('PORT');

    server = app.listen(port, () => {
      logger.info(`Server running on http://localhost:${port}`);
    });
  } catch (err) {
    logger.error(err, 'Failed to bootstrap application');
    await shutdownServer();
    process.exit(1);
  }
}

// Graceful shutdown handler
export async function shutdownServer(signal?: string): Promise<void> {
  if (shuttingDown) return shutdownPromise!;
  shuttingDown = true;

  shutdownPromise = (async () => {
    try {
      logger.info({ signal }, `Received ${signal ?? 'shutdown'} signal. Closing server...`);

      if (server) {
        await new Promise<void>((resolve, reject) => {
          server!.close((err) => (err ? reject(err) : resolve()));
        });
        logger.info('HTTP server closed.');
      }

      await db.destroy();
      logger.info('Database connection closed.');

      logger.info('Shutdown complete.');

      // Flush logs if logger supports it
      if (typeof logger.flush === 'function') {
        await new Promise<void>((resolve) => logger.flush(() => resolve()));
      }

      // Ensure stdin is paused to avoid terminal waiting
      if (!process.stdin.isPaused()) {
        process.stdin.pause();
      }

      // Synchronous exit: ensures terminal doesn't wait for Enter
      process.exit(0);
    } catch (err) {
      logger.error(err, 'Error during shutdown');

      if (typeof logger.flush === 'function') {
        await new Promise<void>((resolve) => logger.flush(() => resolve()));
      }

      if (!process.stdin.isPaused()) {
        process.stdin.pause();
      }

      process.exit(1);
    }
  })();

  return shutdownPromise;
}

// Start application
bootstrap();

// Handle OS termination signals
['SIGINT', 'SIGTERM', 'SIGHUP'].forEach((signal) => {
  process.on(signal, () => shutdownServer(signal));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error(err, 'Uncaught exception');
  shutdownServer('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled promise rejection');
  shutdownServer('unhandledRejection');
});
