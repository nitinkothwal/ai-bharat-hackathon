import { EnvConfigProvider } from './env.provider';
import { AwsSsmConfigProvider } from './aws-ssm.provider';
import { ConfigProvider } from './config-provider';

export function createConfigProvider(): ConfigProvider {
  const provider = process.env.CONFIG_PROVIDER ?? 'env';

  switch (provider) {
    case 'aws-ssm':
      return new AwsSsmConfigProvider(process.env.AWS_SSM_PATH!);
    case 'env':
    default:
      return new EnvConfigProvider();
  }
}
