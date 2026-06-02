import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  RABBITMQ_EXCHANGE,
  RABBITMQ_ROUTING_KEY,
  EventType,
  createNotificationEvent,
  serializeEvent,
} from '@app/common';
import { RabbitMqPublisherService } from './rabbitmq-publisher.service';

const mockPublish = jest.fn();
const mockConnect = jest.fn();
const mockCreateChannel = jest.fn();
const mockChannelClose = jest.fn();
const mockConnectionClose = jest.fn();

jest.mock('amqp-connection-manager', () => ({
  __esModule: true,
  default: {
    connect: (...args: unknown[]) => mockConnect(...args),
  },
}));

describe('RabbitMqPublisherService', () => {
  let service: RabbitMqPublisherService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPublish.mockImplementation((_ex, _rk, _content, _opts, cb) => cb());
    mockChannelClose.mockResolvedValue(undefined);
    mockConnectionClose.mockResolvedValue(undefined);

    mockCreateChannel.mockReturnValue({
      publish: mockPublish,
      close: mockChannelClose,
      on: jest.fn(),
    });

    mockConnect.mockReturnValue({
      on: jest.fn(),
      createChannel: mockCreateChannel,
      close: mockConnectionClose,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RabbitMqPublisherService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('amqp://localhost:5672'),
            get: jest.fn().mockReturnValue('events.notifications'),
          },
        },
      ],
    }).compile();

    service = module.get(RabbitMqPublisherService);
    await service.onModuleInit();
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  it('initializes RabbitMQ connection and channel', () => {
    expect(mockConnect).toHaveBeenCalledWith(['amqp://localhost:5672']);
    expect(mockCreateChannel).toHaveBeenCalled();
  });

  it('publishes serialized JSON with publisher confirm', async () => {
    const event = createNotificationEvent({
      payload: { chatId: '123', text: 'hello' },
    });

    await service.publish(event);

    expect(mockPublish).toHaveBeenCalledWith(
      RABBITMQ_EXCHANGE,
      RABBITMQ_ROUTING_KEY,
      Buffer.from(serializeEvent(event)),
      expect.objectContaining({
        persistent: true,
        messageId: event.id,
        contentType: 'application/json',
      }),
      expect.any(Function),
    );
  });

  it('retries publish on temporary failure', async () => {
    const event = createNotificationEvent({
      payload: { chatId: '123', text: 'hello' },
    });

    mockPublish
      .mockImplementationOnce((_a, _b, _c, _d, cb) =>
        cb(new Error('connection reset')),
      )
      .mockImplementation((_a, _b, _c, _d, cb) => cb());

    jest.useFakeTimers({ advanceTimers: true });

    const publishPromise = service.publish(event);
    await publishPromise;

    expect(mockPublish).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });

  it('throws when publish fails after all retries', async () => {
    const event = createNotificationEvent({
      payload: { chatId: '123', text: 'hello' },
    });

    mockPublish.mockImplementation((_a, _b, _c, _d, cb) =>
      cb(new Error('persistent failure')),
    );

    jest.useFakeTimers({ advanceTimers: true });

    await expect(service.publish(event)).rejects.toThrow('persistent failure');
    expect(mockPublish).toHaveBeenCalledTimes(3);

    jest.useRealTimers();
  });
});
