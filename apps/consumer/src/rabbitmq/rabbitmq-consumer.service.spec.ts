import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { createNotificationEvent, serializeEvent } from '@app/common';
import { ConsumerService } from '../consumer.service';
import { RabbitMqConsumerService } from './rabbitmq-consumer.service';
import { ConfirmChannel, ConsumeMessage } from 'amqplib';

describe('RabbitMqConsumerService', () => {
  let consumer: RabbitMqConsumerService;
  let consumerService: jest.Mocked<Pick<ConsumerService, 'processEvent'>>;
  let channel: jest.Mocked<Pick<ConfirmChannel, 'ack' | 'nack' | 'publish'>>;

  beforeEach(async () => {
    consumerService = { processEvent: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RabbitMqConsumerService,
        { provide: ConsumerService, useValue: consumerService },
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
    consumerService.processEvent.mockResolvedValue('processed');

    await consumer.handleDelivery(buildMessage(), channel as ConfirmChannel);

    expect(channel.ack).toHaveBeenCalledTimes(1);
    expect(channel.nack).not.toHaveBeenCalled();
  });

  it('acks duplicate events without reprocessing', async () => {
    consumerService.processEvent.mockResolvedValue('duplicate');

    await consumer.handleDelivery(buildMessage(), channel as ConfirmChannel);

    expect(channel.ack).toHaveBeenCalledTimes(1);
  });

  it('requeues message on transient failure', async () => {
    consumerService.processEvent.mockRejectedValue(new Error('notifier down'));

    await consumer.handleDelivery(buildMessage(), channel as ConfirmChannel);

    expect(channel.publish).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.any(Buffer),
      expect.objectContaining({
        headers: expect.objectContaining({ 'x-retry-count': 1 }),
      }),
    );
    expect(channel.ack).toHaveBeenCalledTimes(1);
    expect(channel.nack).not.toHaveBeenCalled();
  });

  it('nacks to DLQ after max retries', async () => {
    consumerService.processEvent.mockRejectedValue(new Error('notifier down'));

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

  it('getRetryCount reads x-retry-count header', () => {
    const message = buildMessage(undefined, { 'x-retry-count': 2 });
    expect(consumer.getRetryCount(message)).toBe(2);
  });
});
