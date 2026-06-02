import { Injectable } from '@nestjs/common';
import { HealthCheckStatus, HealthResponseDto } from '@app/common';
import { RabbitMqPublisherService } from '../rabbitmq/rabbitmq-publisher.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly rabbitMqPublisherService: RabbitMqPublisherService,
  ) {}

  check(): HealthResponseDto {
    const rabbitmq: HealthCheckStatus = this.rabbitMqPublisherService.isConnected()
      ? 'up'
      : 'down';

    return {
      status: rabbitmq === 'up' ? 'ok' : 'error',
      service: 'producer',
      checks: { rabbitmq },
    };
  }
}
