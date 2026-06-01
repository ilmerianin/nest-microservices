import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { EnvironmentVariables } from './environment-variables';

export type EnvKey = keyof EnvironmentVariables;

export function createEnvValidator(requiredKeys: EnvKey[]) {
  return (config: Record<string, unknown>): EnvironmentVariables => {
    const validatedConfig = plainToInstance(EnvironmentVariables, config, {
      enableImplicitConversion: true,
    });

    const errors = validateSync(validatedConfig, {
      skipMissingProperties: true,
    });

    if (errors.length > 0) {
      throw new Error(errors.toString());
    }

    const missing = requiredKeys.filter(
      (key) =>
        validatedConfig[key] === undefined || validatedConfig[key] === '',
    );

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}`,
      );
    }

    return validatedConfig;
  };
}

export const producerEnvValidator = createEnvValidator([
  'RABBITMQ_URL',
  'RABBITMQ_QUEUE',
]);

export const consumerEnvValidator = createEnvValidator([
  'RABBITMQ_URL',
  'RABBITMQ_QUEUE',
  'NOTIFIER_URL',
]);

export const notifierEnvValidator = createEnvValidator(['TELEGRAM_BOT_TOKEN']);
