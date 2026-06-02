import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NotificationPayloadDto } from '@app/common';
import { AcceptNotificationResponseDto } from './dto/accept-notification-response.dto';
import { NotifierService } from './notifier.service';

@ApiTags('notifications')
@Controller()
export class NotifierController {
  constructor(private readonly notifierService: NotifierService) {}

  @Get()
  @ApiOperation({ summary: 'Health / smoke endpoint' })
  getHello(): string {
    return this.notifierService.getHello();
  }

  @Post('notify')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Принять уведомление от Consumer (Telegram — этап 4)',
  })
  @ApiResponse({ status: 202, type: AcceptNotificationResponseDto })
  notify(
    @Body() payload: NotificationPayloadDto,
  ): AcceptNotificationResponseDto {
    this.notifierService.acceptNotification(payload);
    return { status: 'accepted' };
  }
}
