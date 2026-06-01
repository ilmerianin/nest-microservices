import { EventDto } from '../dto/event.dto';

export interface IEventHandler {
  handle(event: EventDto): Promise<void>;
}
