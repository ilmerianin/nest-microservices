import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  NOTIFICATION_SENDER,
  NotificationPayloadDto,
} from '@app/common';
import type { INotificationSender } from '@app/common';

@Injectable()
export class NotifierService {
  private readonly logger = new Logger(NotifierService.name);

  constructor(
    @Inject(NOTIFICATION_SENDER)
    private readonly notificationSender: INotificationSender,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async sendNotification(payload: NotificationPayloadDto): Promise<void> {
    await this.notificationSender.sendMessage(payload.chatId, payload.text);
    this.logger.log(
      `Notification sent: chatId=${payload.chatId}, text="${payload.text}"`,
    );
  }
}
