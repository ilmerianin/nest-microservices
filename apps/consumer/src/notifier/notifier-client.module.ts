import { Module } from '@nestjs/common';
import { NOTIFIER_CLIENT } from '@app/common';
import { NotifierClientService } from './notifier-client.service';

@Module({
  providers: [
    NotifierClientService,
    {
      provide: NOTIFIER_CLIENT,
      useExisting: NotifierClientService,
    },
  ],
  exports: [NOTIFIER_CLIENT, NotifierClientService],
})
export class NotifierClientModule {}
