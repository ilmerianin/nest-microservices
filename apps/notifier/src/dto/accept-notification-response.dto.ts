import { ApiProperty } from '@nestjs/swagger';

export class AcceptNotificationResponseDto {
  @ApiProperty({ example: 'accepted', enum: ['accepted'] })
  status: 'accepted';
}
