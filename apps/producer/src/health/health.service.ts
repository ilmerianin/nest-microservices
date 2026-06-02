import { Inject, Injectable } from '@nestjs/common';
import {
  HealthCheckStatus,
  HealthResponseDto,
  RABBITMQ_CONNECTION_HEALTH,
} from '@app/contracts';
import type { IRabbitMqConnectionHealth } from '@app/contracts';

@Injectable()
export class HealthService {
  constructor(
    @Inject(RABBITMQ_CONNECTION_HEALTH)
    private readonly rabbitMqHealth: IRabbitMqConnectionHealth,
  ) {}

  check(): HealthResponseDto {
    const rabbitmq: HealthCheckStatus = this.rabbitMqHealth.isConnected()
      ? 'up'
      : 'down';

    return {
      status: rabbitmq === 'up' ? 'ok' : 'error',
      service: 'producer',
      checks: { rabbitmq },
    };
  }
}
