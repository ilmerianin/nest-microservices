import { Module } from '@nestjs/common';
import { AppConfigModule, consumerEnvValidator } from '@app/common';
import { ConsumerController } from './consumer.controller';
import { ConsumerService } from './consumer.service';

@Module({
  imports: [AppConfigModule.forRoot({ validate: consumerEnvValidator })],
  controllers: [ConsumerController],
  providers: [ConsumerService],
})
export class ConsumerModule {}
