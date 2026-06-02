import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  RABBITMQ_EXCHANGE,
  RABBITMQ_MAX_CONSUME_RETRIES,
  RABBITMQ_QUEUE,
  RABBITMQ_ROUTING_KEY,
  declareEventTopology,
  parseEvent,
} from '@app/common';
import amqp, {
  AmqpConnectionManager,
  ChannelWrapper,
} from 'amqp-connection-manager';
import { ConfirmChannel, ConsumeMessage } from 'amqplib';
import { ConsumerService } from '../consumer.service';

@Injectable()
export class RabbitMqConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMqConsumerService.name);
  private connection: AmqpConnectionManager | null = null;
  private channelWrapper: ChannelWrapper | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly consumerService: ConsumerService,
  ) {}

  async onModuleInit(): Promise<void> {
    const url = this.configService.getOrThrow<string>('RABBITMQ_URL');
    const queue =
      this.configService.get<string>('RABBITMQ_QUEUE') ?? RABBITMQ_QUEUE;

    this.connection = amqp.connect([url]);

    this.connection.on('connect', () =>
      this.logger.log('RabbitMQ connection established'),
    );
    this.connection.on('disconnect', ({ err }) =>
      this.logger.warn(
        `RabbitMQ disconnected: ${err?.message ?? 'unknown reason'}`,
      ),
    );

    this.channelWrapper = this.connection.createChannel({
      setup: async (channel: ConfirmChannel) => {
        await declareEventTopology(channel, queue);
        await channel.prefetch(1);

        await channel.consume(
          queue,
          (message) => {
            void this.handleDelivery(message, channel);
          },
          { noAck: false },
        );

        this.logger.log(`Consuming queue=${queue} (manual ack)`);
      },
    });

    this.channelWrapper.on('error', (err) =>
      this.logger.error(`RabbitMQ channel error: ${err.message}`),
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.channelWrapper?.close();
    await this.connection?.close();
  }

  async handleDelivery(
    message: ConsumeMessage | null,
    channel: ConfirmChannel,
  ): Promise<void> {
    if (!message) {
      return;
    }

    const eventId = message.properties.messageId ?? 'unknown';

    try {
      const event = parseEvent(message.content.toString());
      const result = await this.consumerService.processEvent(event);

      channel.ack(message);

      if (result === 'duplicate') {
        this.logger.log(`Event acknowledged (duplicate): id=${event.id}`);
      } else {
        this.logger.log(`Event acknowledged: id=${event.id}`);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `Event processing failed: id=${eventId} — ${err.message}`,
        err.stack,
      );

      await this.handleFailure(message, channel, eventId);
    }
  }

  private async handleFailure(
    message: ConsumeMessage,
    channel: ConfirmChannel,
    eventId: string,
  ): Promise<void> {
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
