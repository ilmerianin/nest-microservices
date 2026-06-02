import { isValidEventId } from './event-id.util';
import { IIdempotencyStore } from '../domain/interfaces/idempotency-store.interface';

export class InMemoryIdempotencyStore implements IIdempotencyStore {
  private readonly processed = new Set<string>();

  hasProcessed(id: string): boolean {
    if (!isValidEventId(id)) {
      return false;
    }
    return this.processed.has(id);
  }

  markProcessed(id: string): void {
    if (!isValidEventId(id)) {
      throw new Error(`Invalid event id: ${id}`);
    }
    this.processed.add(id);
  }
}

export function isDuplicateEvent(
  store: IIdempotencyStore,
  eventId: string,
): boolean {
  return store.hasProcessed(eventId);
}
