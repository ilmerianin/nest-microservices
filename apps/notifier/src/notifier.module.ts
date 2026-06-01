import { Module } from '@nestjs/common';
import { AppConfigModule, notifierEnvValidator } from '@app/common';
import { NotifierController } from './notifier.controller';
import { NotifierService } from './notifier.service';

@Module({
  imports: [AppConfigModule.forRoot({ validate: notifierEnvValidator })],
  controllers: [NotifierController],
  providers: [NotifierService],
})
export class NotifierModule {}
