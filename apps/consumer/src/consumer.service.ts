import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  EventDto,
  IDEMPOTENCY_STORE,
  NOTIFIER_CLIENT,
  isDuplicateEvent,
} from '@app/common';
import type {
  IEventHandler,
  IIdempotencyStore,
  INotifierClient,
} from '@app/common';

@Injectable()
export class ConsumerService implements IEventHandler {
  private readonly logger = new Logger(ConsumerService.name);

  constructor(
    @Inject(NOTIFIER_CLIENT)
    private readonly notifierClient: INotifierClient,
    @Inject(IDEMPOTENCY_STORE)
    private readonly idempotencyStore: IIdempotencyStore,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async handle(event: EventDto): Promise<void> {
    if (isDuplicateEvent(this.idempotencyStore, event.id)) {
      this.logger.log(`Event skipped (duplicate): id=${event.id}`);
      return;
    }

    await this.notifierClient.notify(event.payload);
    this.idempotencyStore.markProcessed(event.id);
    this.logger.log(`Event processed successfully: id=${event.id}`);
  }
}
