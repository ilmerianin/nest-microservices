import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { INotifierClient, NotificationPayloadDto } from '@app/common';

@Injectable()
export class NotifierClientService implements INotifierClient {
  private readonly logger = new Logger(NotifierClientService.name);

  constructor(private readonly configService: ConfigService) {}

  async notify(payload: NotificationPayloadDto): Promise<void> {
    const baseUrl = this.configService.getOrThrow<string>('NOTIFIER_URL');
    const url = `${baseUrl.replace(/\/$/, '')}/notify`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Notifier request failed: ${response.status} ${response.statusText} — ${body}`,
      );
    }

    this.logger.log(`Notifier accepted: chatId=${payload.chatId}`);
  }
}
