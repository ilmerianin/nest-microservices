import { ApiProperty } from '@nestjs/swagger';

export class AcceptNotificationResponseDto {
  @ApiProperty({ example: 'sent', enum: ['sent'] })
  status: 'sent';

  @ApiProperty({ example: '123456789', description: 'Telegram chat ID' })
  chatId: string;
}
