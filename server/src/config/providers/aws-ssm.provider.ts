import { SSMClient, GetParametersByPathCommand } from '@aws-sdk/client-ssm';

import { ConfigProvider } from './config-provider';

export class AwsSsmConfigProvider implements ConfigProvider {
  private client = new SSMClient({});

  constructor(private readonly basePath: string) {}

  async load(): Promise<Record<string, string>> {
    const result: Record<string, string> = {};
    let nextToken: string | undefined;

    do {
      const command = new GetParametersByPathCommand({
        Path: this.basePath,
        Recursive: true,
        WithDecryption: true,
        NextToken: nextToken,
      });

      const response = await this.client.send(command);

      for (const param of response.Parameters ?? []) {
        if (!param.Name || param.Value === undefined) continue;

        // /my-api/prod/DB_HOST => DB_HOST
        const key = param.Name.split('/').pop()!;
        result[key] = param.Value;
      }

      nextToken = response.NextToken;
    } while (nextToken);

    return result;
  }
}
