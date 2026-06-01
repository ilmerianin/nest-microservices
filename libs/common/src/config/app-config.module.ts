import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { EnvironmentVariables } from './environment-variables';

@Module({})
export class AppConfigModule {
  static forRoot(options: {
    validate: (config: Record<string, unknown>) => EnvironmentVariables;
  }): DynamicModule {
    return {
      module: AppConfigModule,
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: [
            join(process.cwd(), '.env'),
            join(process.cwd(), '..', '.env'),
          ],
          validate: options.validate,
        }),
      ],
      exports: [ConfigModule],
    };
  }
}
