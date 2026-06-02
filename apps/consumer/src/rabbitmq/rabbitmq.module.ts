import { Module } from '@nestjs/common';
import { ConsumerCoreModule } from '../consumer-core.module';
import { RabbitMqConsumerService } from './rabbitmq-consumer.service';

@Module({
  imports: [ConsumerCoreModule],
  providers: [RabbitMqConsumerService],
  exports: [RabbitMqConsumerService, ConsumerCoreModule],
})
export class RabbitMqModule {}
