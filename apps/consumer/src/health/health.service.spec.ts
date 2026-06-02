import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HealthService } from './health.service';
import { RabbitMqConsumerService } from '../rabbitmq/rabbitmq-consumer.service';

describe('HealthService', () => {
  let service: HealthService;
  let consumer: { isConnected: jest.Mock };
  let configGet: jest.Mock;

  beforeEach(async () => {
    consumer = { isConnected: jest.fn() };
    configGet = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: ConfigService,
          useValue: { get: configGet },
        },
        {
          provide: RabbitMqConsumerService,
          useValue: consumer,
        },
      ],
    }).compile();

    service = module.get(HealthService);
  });

  it('returns ok when RabbitMQ and NOTIFIER_URL are ready', () => {
    consumer.isConnected.mockReturnValue(true);
    configGet.mockReturnValue('http://notifier:3001');

    expect(service.check()).toEqual({
      status: 'ok',
      service: 'consumer',
      checks: { rabbitmq: 'up', notifier: 'up' },
    });
  });

  it('returns error when RabbitMQ is disconnected', () => {
    consumer.isConnected.mockReturnValue(false);
    configGet.mockReturnValue('http://notifier:3001');

    expect(service.check().status).toBe('error');
    expect(service.check().checks.rabbitmq).toBe('down');
  });
});
