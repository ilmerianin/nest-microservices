import { Module } from '@nestjs/common';
import { AppConfigModule, producerEnvValidator } from '@app/common';
import { HealthController } from './health/health.controller';
import { HealthService } from './health/health.service';
import { ProducerController } from './producer.controller';
import { ProducerService } from './producer.service';
import { RabbitMqModule } from './rabbitmq/rabbitmq.module';

@Module({
  imports: [
    AppConfigModule.forRoot({ validate: producerEnvValidator }),
    RabbitMqModule,
  ],
  controllers: [ProducerController, HealthController],
  providers: [ProducerService, HealthService],
})
export class ProducerModule {}
