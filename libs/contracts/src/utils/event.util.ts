import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateNotificationEventDto } from '../domain/dto/create-notification-event.dto';
import { EventDto } from '../domain/dto/event.dto';
import { EventType } from '../domain/enums/event-type.enum';
import { generateEventId } from './event-id.util';

export function createNotificationEvent(
  dto: CreateNotificationEventDto,
): EventDto {
  return {
    id: generateEventId(),
    type: EventType.NOTIFICATION_REQUESTED,
    payload: dto.payload,
    createdAt: new Date().toISOString(),
  };
}

export function validateEventDto(data: unknown): EventDto {
  const event = plainToInstance(EventDto, data);
  const errors = validateSync(event);

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return event;
}

export function serializeEvent(event: EventDto): string {
  return JSON.stringify(event);
}

export function parseEvent(raw: string): EventDto {
  const data: unknown = JSON.parse(raw);
  return validateEventDto(data);
}
