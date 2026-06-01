import { Module } from '@nestjs/common';
import { AppConfigModule, producerEnvValidator } from '@app/common';
import { ProducerController } from './producer.controller';
import { ProducerService } from './producer.service';

@Module({
  imports: [AppConfigModule.forRoot({ validate: producerEnvValidator })],
  controllers: [ProducerController],
  providers: [ProducerService],
})
export class ProducerModule {}
