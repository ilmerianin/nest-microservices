import { Injectable, Logger } from '@nestjs/common';
import {
  RABBITMQ_EXCHANGE,
  RABBITMQ_MAX_CONSUME_RETRIES,
  RABBITMQ_ROUTING_KEY,
} from '@app/contracts';
import { ConfirmChannel, ConsumeMessage } from 'amqplib';

@Injectable()
export class RabbitMqConsumeRetryPolicy {
  private readonly logger = new Logger(RabbitMqConsumeRetryPolicy.name);

  handleFailure(
    message: ConsumeMessage,
    channel: ConfirmChannel,
    eventId: string,
  ): void {
    const retryCount = this.getRetryCount(message);

    if (retryCount >= RABBITMQ_MAX_CONSUME_RETRIES - 1) {
      channel.nack(message, false, false);
      this.logger.warn(
        `Event sent to DLQ after ${retryCount + 1} attempts: id=${eventId}`,
      );
      return;
    }

    channel.publish(
      RABBITMQ_EXCHANGE,
      RABBITMQ_ROUTING_KEY,
      message.content,
      {
        persistent: true,
        messageId: message.properties.messageId,
        contentType: message.properties.contentType ?? 'application/json',
        headers: {
          ...message.properties.headers,
          'x-retry-count': retryCount + 1,
        },
      },
    );
    channel.ack(message);

    this.logger.warn(
      `Event requeued for retry ${retryCount + 2}/${RABBITMQ_MAX_CONSUME_RETRIES}: id=${eventId}`,
    );
  }

  getRetryCount(message: ConsumeMessage): number {
    const header = message.properties.headers?.['x-retry-count'];
    return typeof header === 'number' ? header : 0;
  }
}
