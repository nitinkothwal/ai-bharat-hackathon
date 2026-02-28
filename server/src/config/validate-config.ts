import { z } from 'zod';

import { config } from './config';
import { configSchema } from './config.schema';
import logger from './logger';

let validated = false;

export function validateConfigOnce(): void {
  if (validated) return;

  const rawConfig = config._getAllUnsafe();

  const parsed = configSchema.safeParse(rawConfig);

  if (!parsed.success) {
    logger.error('Invalid configuration:');
    logger.error(z.treeifyError(parsed.error));
    process.exit(1);
  }

  config._markValidated();
  validated = true;
}
