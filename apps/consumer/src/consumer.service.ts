import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  EventDto,
  IEventHandler,
  InMemoryIdempotencyStore,
  NOTIFIER_CLIENT,
  isDuplicateEvent,
} from '@app/common';
import type { INotifierClient } from '@app/common';

export type ProcessEventResult = 'processed' | 'duplicate';

@Injectable()
export class ConsumerService implements IEventHandler {
  private readonly logger = new Logger(ConsumerService.name);
  private readonly idempotencyStore = new InMemoryIdempotencyStore();

  constructor(
    @Inject(NOTIFIER_CLIENT)
    private readonly notifierClient: INotifierClient,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  isAlreadyProcessed(event: EventDto): boolean {
    return isDuplicateEvent(this.idempotencyStore, event.id);
  }

  markAsProcessed(event: EventDto): void {
    this.idempotencyStore.markProcessed(event.id);
  }

  async processEvent(event: EventDto): Promise<ProcessEventResult> {
    if (this.isAlreadyProcessed(event)) {
      this.logger.log(`Event skipped (duplicate): id=${event.id}`);
      return 'duplicate';
    }

    await this.notifierClient.notify(event.payload);
    this.markAsProcessed(event);
    this.logger.log(`Event processed successfully: id=${event.id}`);
    return 'processed';
  }

  async handle(event: EventDto): Promise<void> {
    await this.processEvent(event);
  }
}
