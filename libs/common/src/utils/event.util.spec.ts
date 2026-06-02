import { EventType } from '../domain/enums/event-type.enum';
import {
  createNotificationEvent,
  parseEvent,
  serializeEvent,
} from './event.util';

describe('event.util', () => {
  it('createNotificationEvent assigns id, type and createdAt', () => {
    const event = createNotificationEvent({
      payload: { chatId: '99', text: 'hello' },
    });

    expect(event.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(event.type).toBe(EventType.NOTIFICATION_REQUESTED);
    expect(event.payload).toEqual({ chatId: '99', text: 'hello' });
    expect(new Date(event.createdAt).toISOString()).toBe(event.createdAt);
  });

  it('serializeEvent and parseEvent round-trip', () => {
    const event = createNotificationEvent({
      payload: { chatId: '1', text: 'round-trip' },
    });

    const parsed = parseEvent(serializeEvent(event));

    expect(parsed.id).toBe(event.id);
    expect(parsed.type).toBe(event.type);
    expect(parsed.payload).toEqual(event.payload);
    expect(parsed.createdAt).toBe(event.createdAt);
  });

  it('parseEvent rejects invalid payload', () => {
    expect(() =>
      parseEvent(JSON.stringify({ id: 'x', type: 'bad', payload: {} })),
    ).toThrow();
  });
});
