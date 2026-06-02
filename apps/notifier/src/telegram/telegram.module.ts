import { Module } from '@nestjs/common';
import { NOTIFICATION_SENDER } from '@app/common';
import { TelegramService } from './telegram.service';

@Module({
  providers: [
    TelegramService,
    {
      provide: NOTIFICATION_SENDER,
      useExisting: TelegramService,
    },
  ],
  exports: [NOTIFICATION_SENDER, TelegramService],
})
export class TelegramModule {}
