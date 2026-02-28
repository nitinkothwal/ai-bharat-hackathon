export interface ConfigProvider {
  load(): Promise<Record<string, string>>;
}
