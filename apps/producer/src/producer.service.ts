import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  CreateNotificationEventDto,
  EVENT_PUBLISHER,
  EventDto,
  createNotificationEvent,
} from '@app/common';
import type { IEventPublisher } from '@app/common';
import { PublishEventResponseDto } from './dto/publish-event-response.dto';

@Injectable()
export class ProducerService {
  private readonly logger = new Logger(ProducerService.name);

  constructor(
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: IEventPublisher,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  buildEvent(dto: CreateNotificationEventDto): EventDto {
    return createNotificationEvent(dto);
  }

  async publishEvent(
    dto: CreateNotificationEventDto,
  ): Promise<PublishEventResponseDto> {
    const event = this.buildEvent(dto);

    try {
      await this.eventPublisher.publish(event);
      return { id: event.id, status: 'published' };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to publish event id=${event.id}: ${message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
