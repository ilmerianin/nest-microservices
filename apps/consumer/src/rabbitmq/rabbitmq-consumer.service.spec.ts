import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EVENT_HANDLER, createNotificationEvent, serializeEvent } from '@app/contracts';
import { RabbitMqConsumeRetryPolicy } from './rabbitmq-consume-retry.policy';
import { RabbitMqConnectionService } from './rabbitmq-connection.service';
import { RabbitMqConsumerService } from './rabbitmq-consumer.service';
import { ConfirmChannel, ConsumeMessage } from 'amqplib';

describe('RabbitMqConsumerService', () => {
  let consumer: RabbitMqConsumerService;
  let eventHandler: { handle: jest.Mock };
  let channel: jest.Mocked<Pick<ConfirmChannel, 'ack' | 'nack' | 'publish'>>;

  beforeEach(async () => {
    eventHandler = { handle: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RabbitMqConsumerService,
        RabbitMqConsumeRetryPolicy,
        {
          provide: RabbitMqConnectionService,
          useValue: {
            setChannelSetup: jest.fn(),
            start: jest.fn().mockResolvedValue(undefined),
          },
        },
        { provide: EVENT_HANDLER, useValue: eventHandler },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('amqp://localhost'),
            get: jest.fn().mockReturnValue('events.notifications'),
          },
        },
      ],
    }).compile();

    consumer = module.get(RabbitMqConsumerService);

    channel = {
      ack: jest.fn(),
      nack: jest.fn(),
      publish: jest.fn(),
    };
  });

  function buildMessage(
    event = createNotificationEvent({
      payload: { chatId: '1', text: 'hi' },
    }),
    headers: Record<string, unknown> = {},
  ): ConsumeMessage {
    return {
      content: Buffer.from(serializeEvent(event)),
      properties: {
        messageId: event.id,
        contentType: 'application/json',
        headers,
      },
      fields: {
        deliveryTag: 1,
        redelivered: false,
        exchange: 'events',
        routingKey: 'notification.requested',
      },
    } as ConsumeMessage;
  }

  it('acks message on successful processing', async () => {
    await consumer.handleDelivery(buildMessage(), channel as ConfirmChannel);

    expect(eventHandler.handle).toHaveBeenCalledTimes(1);
    expect(channel.ack).toHaveBeenCalledTimes(1);
    expect(channel.nack).not.toHaveBeenCalled();
  });

  it('requeues message on transient failure', async () => {
    eventHandler.handle.mockRejectedValue(new Error('notifier down'));

    await consumer.handleDelivery(buildMessage(), channel as ConfirmChannel);

    expect(channel.publish).toHaveBeenCalled();
    expect(channel.ack).toHaveBeenCalledTimes(1);
    expect(channel.nack).not.toHaveBeenCalled();
  });

  it('nacks to DLQ after max retries', async () => {
    eventHandler.handle.mockRejectedValue(new Error('notifier down'));

    await consumer.handleDelivery(
      buildMessage(undefined, { 'x-retry-count': 2 }),
      channel as ConfirmChannel,
    );

    expect(channel.nack).toHaveBeenCalledWith(
      expect.anything(),
      false,
      false,
    );
    expect(channel.publish).not.toHaveBeenCalled();
  });
});
