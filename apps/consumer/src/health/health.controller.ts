import { Controller, Get, HttpCode, HttpStatus, ServiceUnavailableException } from '@nestjs/common';
import { HealthResponseDto } from '@app/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  check(): HealthResponseDto {
    const health = this.healthService.check();

    if (health.status === 'error') {
      throw new ServiceUnavailableException(health);
    }

    return health;
  }
}
