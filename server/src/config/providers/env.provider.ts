import { ConfigProvider } from './config-provider';

export class EnvConfigProvider implements ConfigProvider {
  async load(): Promise<Record<string, string>> {
    const result: Record<string, string> = {};

    for (const key of Object.values(ConfigKeyEnum)) {
      const value = process.env[key];
      if (value !== undefined) {
        result[key] = value;
      }
    }

    return result;
  }
}

/**
 * TS helper so we can iterate keys at runtime
 */
const ConfigKeyEnum = {
  NODE_ENV: 'NODE_ENV',
  PORT: 'PORT',
  DB_HOST: 'DB_HOST',
  DB_PORT: 'DB_PORT',
  DB_USER: 'DB_USER',
  DB_PASSWORD: 'DB_PASSWORD',
  DB_NAME: 'DB_NAME',
  DB_SSL: 'DB_SSL',
  SESSION_SECRET: 'SESSION_SECRET',
} as const;
