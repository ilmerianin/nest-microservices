import { Module } from '@nestjs/common';
import { NotifierClientModule } from './notifier/notifier-client.module';
import { ConsumerService } from './consumer.service';

@Module({
  imports: [NotifierClientModule],
  providers: [ConsumerService],
  exports: [ConsumerService],
})
export class ConsumerCoreModule {}
