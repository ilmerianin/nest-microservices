import { validate as uuidValidate, version as uuidVersion } from 'uuid';
import { v4 as uuidv4 } from 'uuid';

export function generateEventId(): string {
  return uuidv4();
}

export function isValidEventId(id: string): boolean {
  return uuidValidate(id) && uuidVersion(id) === 4;
}
