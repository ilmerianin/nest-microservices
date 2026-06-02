import { NotificationPayloadDto } from '../dto/notification-payload.dto';

export interface INotifierClient {
  notify(payload: NotificationPayloadDto): Promise<void>;
}
