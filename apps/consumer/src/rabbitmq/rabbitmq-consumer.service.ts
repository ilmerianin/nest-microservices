import {
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EVENT_HANDLER, RABBITMQ_QUEUE, parseEvent } from '@app/contracts';
import type { IEventHandler } from '@app/contracts';
import { declareEventTopology } from '@app/rabbitmq';
import { ConfirmChannel, ConsumeMessage } from 'amqplib';
import { RabbitMqConnectionService } from './rabbitmq-connection.service';
import { RabbitMqConsumeRetryPolicy } from './rabbitmq-consume-retry.policy';

@Injectable()
export class RabbitMqConsumerService implements OnModuleInit {
  private readonly logger = new Logger(RabbitMqConsumerService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly connectionService: RabbitMqConnectionService,
    private readonly retryPolicy: RabbitMqConsumeRetryPolicy,
    @Inject(EVENT_HANDLER)
    private readonly eventHandler: IEventHandler,
  ) {}

  onModuleInit(): void {
    const queue =
      this.configService.get<string>('RABBITMQ_QUEUE') ?? RABBITMQ_QUEUE;

    this.connectionService.setChannelSetup(async (channel: ConfirmChannel) => {
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
    });

    void this.connectionService.start();
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
      await this.eventHandler.handle(event);

      channel.ack(message);
      this.logger.log(`Event acknowledged: id=${event.id}`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `Event processing failed: id=${eventId} — ${err.message}`,
        err.stack,
      );

      this.retryPolicy.handleFailure(message, channel, eventId);
    }
  }
}
