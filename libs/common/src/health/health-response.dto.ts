import { ApiProperty } from '@nestjs/swagger';

export type HealthCheckStatus = 'up' | 'down';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok', enum: ['ok', 'error'] })
  status!: 'ok' | 'error';

  @ApiProperty({ example: 'producer' })
  service!: string;

  @ApiProperty({
    example: { rabbitmq: 'up' },
    additionalProperties: { type: 'string', enum: ['up', 'down'] },
  })
  checks!: Record<string, HealthCheckStatus>;
}
