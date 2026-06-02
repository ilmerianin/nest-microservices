import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  EventDto,
  IEventPublisher,
  IRabbitMqConnectionHealth,
  RABBITMQ_EXCHANGE,
  RABBITMQ_QUEUE,
  RABBITMQ_ROUTING_KEY,
  serializeEvent,
  withRetry,
} from '@app/contracts';
import { declareEventTopology } from '@app/rabbitmq';
import amqp, {
  AmqpConnectionManager,
  ChannelWrapper,
} from 'amqp-connection-manager';
import { ConfirmChannel } from 'amqplib';

const PUBLISH_MAX_ATTEMPTS = 3;
const PUBLISH_BASE_DELAY_MS = 500;

@Injectable()
export class RabbitMqPublisherService
  implements IEventPublisher, IRabbitMqConnectionHealth, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(RabbitMqPublisherService.name);
  private connection: AmqpConnectionManager | null = null;
  private channelWrapper: ChannelWrapper | null = null;

  constructor(private readonly configService: ConfigService) {}

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
      publishTimeout: 10_000,
      setup: async (channel: ConfirmChannel) => {
        await declareEventTopology(channel, queue);
        this.logger.log(
          `RabbitMQ topology ready: exchange=events, queue=${queue}`,
        );
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

  isConnected(): boolean {
    return this.connection?.isConnected() ?? false;
  }

  async publish(event: EventDto): Promise<void> {
    const content = Buffer.from(serializeEvent(event));

    await withRetry(
      () => this.publishWithConfirm(content, event.id),
      {
        maxAttempts: PUBLISH_MAX_ATTEMPTS,
        baseDelayMs: PUBLISH_BASE_DELAY_MS,
        onRetry: (attempt, error) =>
          this.logger.warn(
            `Publish retry ${attempt}/${PUBLISH_MAX_ATTEMPTS} for event ${event.id}: ${error.message}`,
          ),
      },
    );

    this.logger.log(`Event published: id=${event.id}`);
  }

  private publishWithConfirm(content: Buffer, eventId: string): Promise<void> {
    if (!this.channelWrapper) {
      return Promise.reject(new Error('RabbitMQ channel is not initialized'));
    }

    return new Promise((resolve, reject) => {
      this.channelWrapper!.publish(
        RABBITMQ_EXCHANGE,
        RABBITMQ_ROUTING_KEY,
        content,
        {
          persistent: true,
          messageId: eventId,
          contentType: 'application/json',
        },
        (error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        },
      );
    });
  }
}
