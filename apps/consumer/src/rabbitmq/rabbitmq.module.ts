import { Module } from '@nestjs/common';
import { RABBITMQ_CONNECTION_HEALTH } from '@app/contracts';
import { ConsumerCoreModule } from '../consumer-core.module';
import { RabbitMqConnectionService } from './rabbitmq-connection.service';
import { RabbitMqConsumeRetryPolicy } from './rabbitmq-consume-retry.policy';
import { RabbitMqConsumerService } from './rabbitmq-consumer.service';

@Module({
  imports: [ConsumerCoreModule],
  providers: [
    RabbitMqConnectionService,
    RabbitMqConsumeRetryPolicy,
    RabbitMqConsumerService,
    {
      provide: RABBITMQ_CONNECTION_HEALTH,
      useExisting: RabbitMqConnectionService,
    },
  ],
  exports: [
    RabbitMqConsumerService,
    RABBITMQ_CONNECTION_HEALTH,
    ConsumerCoreModule,
  ],
})
export class RabbitMqModule {}
