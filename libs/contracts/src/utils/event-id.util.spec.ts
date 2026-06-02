import { generateEventId, isValidEventId } from './event-id.util';

describe('event-id.util', () => {
  describe('generateEventId', () => {
    it('returns a valid UUID v4', () => {
      const id = generateEventId();
      expect(isValidEventId(id)).toBe(true);
    });

    it('generates unique ids', () => {
      const ids = new Set(Array.from({ length: 10 }, () => generateEventId()));
      expect(ids.size).toBe(10);
    });
  });

  describe('isValidEventId', () => {
    it('rejects invalid strings', () => {
      expect(isValidEventId('not-a-uuid')).toBe(false);
      expect(isValidEventId('')).toBe(false);
    });

    it('rejects non-v4 UUIDs', () => {
      expect(isValidEventId('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(
        false,
      );
    });
  });
});
