import { createConfigProvider } from './providers';
import { ConfigKey } from './config.keys';

class ConfigReader {
  private readonly provider = createConfigProvider();
  private values: Record<string, string> = {};
  private loaded = false;
  private validated = false;
  private readyPromise: Promise<void> | null = null;

  async load(): Promise<void> {
    if (this.readyPromise) return this.readyPromise;

    this.readyPromise = (async () => {
      if (!this.loaded) {
        this.values = await this.provider.load();
        this.loaded = true;
      }
    })();

    return this.readyPromise;
  }

  /** Returns a promise that resolves when config is loaded and validated */
  async ready(): Promise<void> {
    if (!this.loaded || !this.validated) {
      await this.readyPromise;
      if (!this.validated) {
        throw new Error('Config not validated yet');
      }
    }
  }

  /** INTERNAL – used only by validator */
  _getAllUnsafe(): Record<string, string> {
    if (!this.loaded) {
      throw new Error('Config not loaded');
    }
    return { ...this.values };
  }

  /** INTERNAL – called exactly once */
  _markValidated(): void {
    this.validated = true;
  }

  private ensureReady() {
    if (!this.loaded) {
      throw new Error('Config accessed before load()');
    }
    if (!this.validated) {
      throw new Error('Config accessed before validation');
    }
  }

  get(key: ConfigKey): string {
    this.ensureReady();

    const value = this.values[key];
    if (value === undefined) {
      throw new Error(`Missing configuration value: ${key}`);
    }
    return value;
  }

  getNumber(key: ConfigKey): number {
    const value = Number(this.get(key));
    if (Number.isNaN(value)) {
      throw new Error(`Config ${key} is not a number`);
    }
    return value;
  }

  getBoolean(key: ConfigKey): boolean {
    return this.get(key) === 'true';
  }
}

export const config = new ConfigReader();
