import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class NotificationPayloadDto {
  @ApiProperty({ example: '123456789', description: 'Telegram chat ID' })
  @IsString()
  @MinLength(1)
  chatId: string;

  @ApiProperty({ example: 'Текст уведомления', description: 'Текст сообщения' })
  @IsString()
  @MinLength(1)
  text: string;
}
