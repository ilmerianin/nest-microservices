import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;
  let configGet: jest.Mock;

  beforeEach(async () => {
    configGet = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: ConfigService,
          useValue: { get: configGet },
        },
      ],
    }).compile();

    service = module.get(HealthService);
  });

  it('returns ok when bot token is configured', () => {
    configGet.mockReturnValue('123456:ABC');

    expect(service.check()).toEqual({
      status: 'ok',
      service: 'notifier',
      checks: { telegram: 'up' },
    });
  });

  it('returns error when bot token is missing', () => {
    configGet.mockReturnValue(undefined);

    expect(service.check()).toEqual({
      status: 'error',
      service: 'notifier',
      checks: { telegram: 'down' },
    });
  });
});
