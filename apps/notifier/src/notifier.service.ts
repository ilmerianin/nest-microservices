import { Injectable, Logger } from '@nestjs/common';
import { NotificationPayloadDto } from '@app/common';
import { TelegramService } from './telegram/telegram.service';

@Injectable()
export class NotifierService {
  private readonly logger = new Logger(NotifierService.name);

  constructor(private readonly telegramService: TelegramService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async sendNotification(payload: NotificationPayloadDto): Promise<void> {
    await this.telegramService.sendMessage(payload.chatId, payload.text);
    this.logger.log(
      `Notification sent: chatId=${payload.chatId}, text="${payload.text}"`,
    );
  }
}
