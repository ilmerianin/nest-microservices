import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthCheckStatus, HealthResponseDto } from '@app/common';
import { RabbitMqConsumerService } from '../rabbitmq/rabbitmq-consumer.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly rabbitMqConsumerService: RabbitMqConsumerService,
  ) {}

  check(): HealthResponseDto {
    const rabbitmq: HealthCheckStatus = this.rabbitMqConsumerService.isConnected()
      ? 'up'
      : 'down';
    const notifierUrl = this.configService.get<string>('NOTIFIER_URL');
    const notifier: HealthCheckStatus = notifierUrl ? 'up' : 'down';

    const checks = { rabbitmq, notifier };
    const status =
      Object.values(checks).every((value) => value === 'up') ? 'ok' : 'error';

    return {
      status,
      service: 'consumer',
      checks,
    };
  }
}
