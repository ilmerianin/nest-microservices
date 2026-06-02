import { Module } from '@nestjs/common';
import { EVENT_PUBLISHER, RABBITMQ_CONNECTION_HEALTH } from '@app/contracts';
import { RabbitMqPublisherService } from './rabbitmq-publisher.service';

@Module({
  providers: [
    RabbitMqPublisherService,
    {
      provide: EVENT_PUBLISHER,
      useExisting: RabbitMqPublisherService,
    },
    {
      provide: RABBITMQ_CONNECTION_HEALTH,
      useExisting: RabbitMqPublisherService,
    },
  ],
  exports: [EVENT_PUBLISHER, RABBITMQ_CONNECTION_HEALTH, RabbitMqPublisherService],
})
export class RabbitMqModule {}
