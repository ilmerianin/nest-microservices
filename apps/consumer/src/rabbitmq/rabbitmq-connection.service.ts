import {
  Injectable,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IRabbitMqConnectionHealth } from '@app/contracts';
import amqp, {
  AmqpConnectionManager,
  ChannelWrapper,
} from 'amqp-connection-manager';
import { ConfirmChannel } from 'amqplib';

export type ChannelSetupFn = (channel: ConfirmChannel) => Promise<void>;

@Injectable()
export class RabbitMqConnectionService
  implements OnModuleDestroy, IRabbitMqConnectionHealth
{
  private readonly logger = new Logger(RabbitMqConnectionService.name);
  private connection: AmqpConnectionManager | null = null;
  private channelWrapper: ChannelWrapper | null = null;
  private channelSetup: ChannelSetupFn | null = null;
  private started = false;

  constructor(private readonly configService: ConfigService) {}

  setChannelSetup(setup: ChannelSetupFn): void {
    this.channelSetup = setup;
  }

  async start(): Promise<void> {
    if (this.started) {
      return;
    }

    if (!this.channelSetup) {
      throw new Error('RabbitMQ channel setup is not configured');
    }

    const url = this.configService.getOrThrow<string>('RABBITMQ_URL');
    const setup = this.channelSetup;

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
      setup,
    });

    this.channelWrapper.on('error', (err) =>
      this.logger.error(`RabbitMQ channel error: ${err.message}`),
    );

    this.started = true;
  }

  async onModuleDestroy(): Promise<void> {
    await this.channelWrapper?.close();
    await this.connection?.close();
  }

  isConnected(): boolean {
    return this.connection?.isConnected() ?? false;
  }
}
