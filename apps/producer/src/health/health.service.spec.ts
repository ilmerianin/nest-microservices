import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';
import { RabbitMqPublisherService } from '../rabbitmq/rabbitmq-publisher.service';

describe('HealthService', () => {
  let service: HealthService;
  let publisher: { isConnected: jest.Mock };

  beforeEach(async () => {
    publisher = { isConnected: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: RabbitMqPublisherService,
          useValue: publisher,
        },
      ],
    }).compile();

    service = module.get(HealthService);
  });

  it('returns ok when RabbitMQ is connected', () => {
    publisher.isConnected.mockReturnValue(true);

    expect(service.check()).toEqual({
      status: 'ok',
      service: 'producer',
      checks: { rabbitmq: 'up' },
    });
  });

  it('returns error when RabbitMQ is disconnected', () => {
    publisher.isConnected.mockReturnValue(false);

    expect(service.check()).toEqual({
      status: 'error',
      service: 'producer',
      checks: { rabbitmq: 'down' },
    });
  });
});
