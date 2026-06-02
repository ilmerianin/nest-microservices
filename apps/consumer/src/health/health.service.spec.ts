import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
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
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('http://notifier:3001') },
        },
        {
          provide: RABBITMQ_CONNECTION_HEALTH,
          useValue: rabbitMqHealth,
        },
      ],
    }).compile();

    service = module.get(HealthService);
  });

  it('returns ok when RabbitMQ and NOTIFIER_URL are ready', () => {
    rabbitMqHealth.isConnected.mockReturnValue(true);

    expect(service.check()).toEqual({
      status: 'ok',
      service: 'consumer',
      checks: { rabbitmq: 'up', notifier: 'up' },
    });
  });

  it('returns error when RabbitMQ is disconnected', () => {
    rabbitMqHealth.isConnected.mockReturnValue(false);

    expect(service.check().status).toBe('error');
    expect(service.check().checks.rabbitmq).toBe('down');
  });
});
