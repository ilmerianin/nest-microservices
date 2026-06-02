import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseFilters,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { NotificationPayloadDto } from '@app/common';
import { AcceptNotificationResponseDto } from './dto/accept-notification-response.dto';
import { NotifierService } from './notifier.service';
import { TelegramExceptionFilter } from './telegram/telegram-exception.filter';

@ApiTags('notifications')
@Controller()
@UseFilters(TelegramExceptionFilter)
export class NotifierController {
  constructor(private readonly notifierService: NotifierService) {}

  @Get()
  @ApiOperation({ summary: 'Health / smoke endpoint' })
  getHello(): string {
    return this.notifierService.getHello();
  }

  @Post('notify')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Отправить уведомление в Telegram' })
  @ApiResponse({ status: 202, type: AcceptNotificationResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Invalid Telegram bot token' })
  @ApiResponse({ status: 429, description: 'Telegram rate limit exceeded' })
  @ApiResponse({ status: 502, description: 'Telegram API error' })
  async notify(
    @Body() payload: NotificationPayloadDto,
  ): Promise<AcceptNotificationResponseDto> {
    await this.notifierService.sendNotification(payload);
    return { status: 'sent', chatId: payload.chatId };
  }
}
