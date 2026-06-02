import { Module } from '@nestjs/common';
import { AppConfigModule, consumerEnvValidator } from '@app/common';
import { ConsumerController } from './consumer.controller';
import { ConsumerCoreModule } from './consumer-core.module';
import { HealthController } from './health/health.controller';
import { HealthService } from './health/health.service';
import { RabbitMqModule } from './rabbitmq/rabbitmq.module';

@Module({
  imports: [
    AppConfigModule.forRoot({ validate: consumerEnvValidator }),
    ConsumerCoreModule,
    RabbitMqModule,
  ],
  controllers: [ConsumerController, HealthController],
  providers: [HealthService],
})
export class ConsumerModule {}
