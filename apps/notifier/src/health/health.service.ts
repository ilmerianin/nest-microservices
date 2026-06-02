import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthCheckStatus, HealthResponseDto } from '@app/common';

@Injectable()
export class HealthService {
  constructor(private readonly configService: ConfigService) {}

  check(): HealthResponseDto {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    const telegram: HealthCheckStatus =
      token && token !== 'your_token_here' ? 'up' : 'down';

    return {
      status: telegram === 'up' ? 'ok' : 'error',
      service: 'notifier',
      checks: { telegram },
    };
  }
}
