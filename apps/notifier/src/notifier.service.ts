import { Injectable, Logger } from '@nestjs/common';
import { NotificationPayloadDto } from '@app/common';

@Injectable()
export class NotifierService {
  private readonly logger = new Logger(NotifierService.name);

  getHello(): string {
    return 'Hello World!';
  }

  /** Принимает уведомление от Consumer. Telegram-отправка — этап 4. */
  acceptNotification(payload: NotificationPayloadDto): void {
    this.logger.log(
      `Notification accepted: chatId=${payload.chatId}, text="${payload.text}"`,
    );
  }
}
