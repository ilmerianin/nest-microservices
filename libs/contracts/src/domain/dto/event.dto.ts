import { Type } from 'class-transformer';
import {
  IsEnum,
  IsISO8601,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { EventType } from '../enums/event-type.enum';
import { NotificationPayloadDto } from './notification-payload.dto';

export class EventDto {
  @IsUUID()
  id: string;

  @IsEnum(EventType)
  type: EventType;

  @ValidateNested()
  @Type(() => NotificationPayloadDto)
  payload: NotificationPayloadDto;

  @IsISO8601()
  createdAt: string;
}
