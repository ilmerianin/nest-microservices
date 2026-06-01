import { EventType } from '../domain/enums/event-type.enum';
import {
  createNotificationEvent,
  parseEvent,
  serializeEvent,
  validateEventDto,
} from './event.util';
import { generateEventId } from './event-id.util';

describe('event.util', () => {
  const payload = { chatId: '123456789', text: 'Hello' };

  describe('createNotificationEvent', () => {
    it('builds event with UUID and ISO timestamp', () => {
      const event = createNotificationEvent({ payload });

      expect(event.type).toBe(EventType.NOTIFICATION_REQUESTED);
      expect(event.payload).toEqual(payload);
      expect(event.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      expect(new Date(event.createdAt).toISOString()).toBe(event.createdAt);
    });
  });

  describe('serializeEvent / parseEvent', () => {
    it('round-trips JSON without data loss', () => {
      const event = createNotificationEvent({ payload });
      const parsed = parseEvent(serializeEvent(event));

      expect(parsed).toEqual(event);
    });
  });

  describe('validateEventDto', () => {
    it('throws on invalid event shape', () => {
      expect(() => validateEventDto({ id: 'bad' })).toThrow();
    });

    it('accepts valid event', () => {
      const event = {
        id: generateEventId(),
        type: EventType.NOTIFICATION_REQUESTED,
        payload,
        createdAt: new Date().toISOString(),
      };

      expect(validateEventDto(event)).toEqual(event);
    });
  });
});
