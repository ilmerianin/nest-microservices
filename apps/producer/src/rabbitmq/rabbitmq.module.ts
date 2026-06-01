import { Module } from '@nestjs/common';
import { EVENT_PUBLISHER } from '@app/common';
import { RabbitMqPublisherService } from './rabbitmq-publisher.service';

@Module({
  providers: [
    RabbitMqPublisherService,
    {
      provide: EVENT_PUBLISHER,
      useExisting: RabbitMqPublisherService,
    },
  ],
  exports: [EVENT_PUBLISHER, RabbitMqPublisherService],
})
export class RabbitMqModule {}
