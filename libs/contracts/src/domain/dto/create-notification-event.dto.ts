import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { NotificationPayloadDto } from './notification-payload.dto';

/** Входной DTO для Producer HTTP API — без id и createdAt (генерируются сервисом). */
export class CreateNotificationEventDto {
  @ApiProperty({ type: NotificationPayloadDto })
  @ValidateNested()
  @Type(() => NotificationPayloadDto)
  payload: NotificationPayloadDto;
}
