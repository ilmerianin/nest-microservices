import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateNotificationEventDto } from '@app/common';
import { PublishEventResponseDto } from './dto/publish-event-response.dto';
import { ProducerService } from './producer.service';

@ApiTags('events')
@Controller()
export class ProducerController {
  constructor(private readonly producerService: ProducerService) {}

  @Get()
  @ApiOperation({ summary: 'Health / smoke endpoint' })
  getHello(): string {
    return this.producerService.getHello();
  }

  @Post('events')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Опубликовать событие уведомления в RabbitMQ' })
  @ApiResponse({ status: 201, type: PublishEventResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 500, description: 'RabbitMQ publish failed' })
  publishEvent(
    @Body() dto: CreateNotificationEventDto,
  ): Promise<PublishEventResponseDto> {
    return this.producerService.publishEvent(dto);
  }
}
