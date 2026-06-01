import { IsString, MinLength } from 'class-validator';

export class NotificationPayloadDto {
  @IsString()
  @MinLength(1)
  chatId: string;

  @IsString()
  @MinLength(1)
  text: string;
}
