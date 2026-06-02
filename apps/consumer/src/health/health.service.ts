import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  HealthCheckStatus,
  HealthResponseDto,
  RABBITMQ_CONNECTION_HEALTH,
} from '@app/contracts';
import type { IRabbitMqConnectionHealth } from '@app/contracts';

@Injectable()
export class HealthService {
  constructor(
    private readonly configService: ConfigService,
    @Inject(RABBITMQ_CONNECTION_HEALTH)
    private readonly rabbitMqHealth: IRabbitMqConnectionHealth,
  ) {}

  check(): HealthResponseDto {
    const rabbitmq: HealthCheckStatus = this.rabbitMqHealth.isConnected()
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
