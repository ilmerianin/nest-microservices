import { Injectable } from '@nestjs/common';
import {
  EventDto,
  InMemoryIdempotencyStore,
  isDuplicateEvent,
} from '@app/common';

@Injectable()
export class ConsumerService {
  private readonly idempotencyStore = new InMemoryIdempotencyStore();

  getHello(): string {
    return 'Hello World!';
  }

  /** Проверка идемпотентности по event.id — будет использоваться на этапе 3. */
  isAlreadyProcessed(event: EventDto): boolean {
    return isDuplicateEvent(this.idempotencyStore, event.id);
  }

  markAsProcessed(event: EventDto): void {
    this.idempotencyStore.markProcessed(event.id);
  }
}
