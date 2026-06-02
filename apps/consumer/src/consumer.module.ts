import { Module } from '@nestjs/common';
import { AppConfigModule, consumerEnvValidator } from '@app/common';
import { ConsumerController } from './consumer.controller';
import { ConsumerCoreModule } from './consumer-core.module';
import { RabbitMqModule } from './rabbitmq/rabbitmq.module';

@Module({
  imports: [
    AppConfigModule.forRoot({ validate: consumerEnvValidator }),
    ConsumerCoreModule,
    RabbitMqModule,
  ],
  controllers: [ConsumerController],
})
export class ConsumerModule {}
