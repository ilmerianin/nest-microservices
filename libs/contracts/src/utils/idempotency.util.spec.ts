import { InMemoryIdempotencyStore, isDuplicateEvent } from './idempotency.util';
import { generateEventId } from './event-id.util';

describe('idempotency.util', () => {
  let store: InMemoryIdempotencyStore;

  beforeEach(() => {
    store = new InMemoryIdempotencyStore();
  });

  it('returns false for unseen valid event id', () => {
    const id = generateEventId();
    expect(store.hasProcessed(id)).toBe(false);
    expect(isDuplicateEvent(store, id)).toBe(false);
  });

  it('returns true after markProcessed', () => {
    const id = generateEventId();
    store.markProcessed(id);
    expect(store.hasProcessed(id)).toBe(true);
    expect(isDuplicateEvent(store, id)).toBe(true);
  });

  it('throws on invalid event id when marking', () => {
    expect(() => store.markProcessed('invalid')).toThrow('Invalid event id');
  });
});
