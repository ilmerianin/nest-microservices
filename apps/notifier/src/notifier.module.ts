import { Module } from '@nestjs/common';
import { AppConfigModule, notifierEnvValidator } from '@app/common';
import { HealthController } from './health/health.controller';
import { HealthService } from './health/health.service';
import { NotifierController } from './notifier.controller';
import { NotifierService } from './notifier.service';
import { TelegramModule } from './telegram/telegram.module';

@Module({
  imports: [
    AppConfigModule.forRoot({ validate: notifierEnvValidator }),
    TelegramModule,
  ],
  controllers: [NotifierController, HealthController],
  providers: [NotifierService, HealthService],
})
export class NotifierModule {}
