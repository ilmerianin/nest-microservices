import { Module } from '@nestjs/common';
import {
  EVENT_HANDLER,
  IDEMPOTENCY_STORE,
  InMemoryIdempotencyStore,
} from '@app/common';
import { NotifierClientModule } from './notifier/notifier-client.module';
import { ConsumerService } from './consumer.service';

@Module({
  imports: [NotifierClientModule],
  providers: [
    ConsumerService,
    InMemoryIdempotencyStore,
    {
      provide: IDEMPOTENCY_STORE,
      useExisting: InMemoryIdempotencyStore,
    },
    {
      provide: EVENT_HANDLER,
      useExisting: ConsumerService,
    },
  ],
  exports: [ConsumerService, EVENT_HANDLER, IDEMPOTENCY_STORE],
})
export class ConsumerCoreModule {}
