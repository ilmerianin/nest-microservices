import { Injectable } from '@nestjs/common';
import {
  CreateNotificationEventDto,
  EventDto,
  createNotificationEvent,
} from '@app/common';

@Injectable()
export class ProducerService {
  getHello(): string {
    return 'Hello World!';
  }

  /** Собирает доменное событие с UUID — будет использоваться на этапе 2 (RabbitMQ publish). */
  buildEvent(dto: CreateNotificationEventDto): EventDto {
    return createNotificationEvent(dto);
  }
}
