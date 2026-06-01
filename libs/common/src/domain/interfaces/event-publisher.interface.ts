import { EventDto } from '../dto/event.dto';

export interface IEventPublisher {
  publish(event: EventDto): Promise<void>;
}
