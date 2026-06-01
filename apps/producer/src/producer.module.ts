import { Module } from '@nestjs/common';
import { AppConfigModule, producerEnvValidator } from '@app/common';
import { ProducerController } from './producer.controller';
import { ProducerService } from './producer.service';
import { RabbitMqModule } from './rabbitmq/rabbitmq.module';

@Module({
  imports: [
    AppConfigModule.forRoot({ validate: producerEnvValidator }),
    RabbitMqModule,
  ],
  controllers: [ProducerController],
  providers: [ProducerService],
})
export class ProducerModule {}
