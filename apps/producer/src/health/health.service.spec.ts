import { Test, TestingModule } from '@nestjs/testing';
import { RABBITMQ_CONNECTION_HEALTH } from '@app/contracts';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;
  let rabbitMqHealth: { isConnected: jest.Mock };

  beforeEach(async () => {
    rabbitMqHealth = { isConnected: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: RABBITMQ_CONNECTION_HEALTH,
          useValue: rabbitMqHealth,
        },
      ],
    }).compile();

    service = module.get(HealthService);
  });

  it('returns ok when RabbitMQ is connected', () => {
    rabbitMqHealth.isConnected.mockReturnValue(true);

    expect(service.check()).toEqual({
      status: 'ok',
      service: 'producer',
      checks: { rabbitmq: 'up' },
    });
  });

  it('returns error when RabbitMQ is disconnected', () => {
    rabbitMqHealth.isConnected.mockReturnValue(false);

    expect(service.check()).toEqual({
      status: 'error',
      service: 'producer',
      checks: { rabbitmq: 'down' },
    });
  });
});
