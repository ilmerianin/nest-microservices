import { Test, TestingModule } from '@nestjs/testing';
import {
  EVENT_PUBLISHER,
  EventDto,
  IDEMPOTENCY_STORE,
  IIdempotencyStore,
  NOTIFIER_CLIENT,
  NotificationPayloadDto,
} from '@app/common';
import { ConsumerService } from '../apps/consumer/src/consumer.service';
import { ProducerService } from '../apps/producer/src/producer.service';

/**
 * Сквозной e2e без RabbitMQ и Telegram: Producer → EventDto → Consumer → mock Notifier.
 */
describe('Notification pipeline (e2e)', () => {
  let producerService: ProducerService;
  let consumerService: ConsumerService;
  let publishedEvent: EventDto | undefined;
  let notifiedPayload: NotificationPayloadDto | undefined;
  let idempotencyStore: jest.Mocked<IIdempotencyStore>;

  beforeEach(async () => {
    publishedEvent = undefined;
    notifiedPayload = undefined;
    idempotencyStore = {
      hasProcessed: jest.fn().mockReturnValue(false),
      markProcessed: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProducerService,
        ConsumerService,
        {
          provide: EVENT_PUBLISHER,
          useValue: {
            publish: jest.fn(async (event: EventDto) => {
              publishedEvent = event;
            }),
          },
        },
        {
          provide: NOTIFIER_CLIENT,
          useValue: {
            notify: jest.fn(async (payload: NotificationPayloadDto) => {
              notifiedPayload = payload;
            }),
          },
        },
        { provide: IDEMPOTENCY_STORE, useValue: idempotencyStore },
      ],
    }).compile();

    producerService = module.get(ProducerService);
    consumerService = module.get(ConsumerService);
  });

  it('publish → consume → notify (mock Telegram)', async () => {
    const dto = {
      payload: { chatId: '123456789', text: 'Pipeline e2e message' },
    };

    const response = await producerService.publishEvent(dto);

    expect(response.status).toBe('published');
    expect(publishedEvent).toBeDefined();
    expect(publishedEvent!.id).toBe(response.id);
    expect(publishedEvent!.payload).toEqual(dto.payload);

    await consumerService.handle(publishedEvent!);

    expect(notifiedPayload).toEqual(dto.payload);
    expect(idempotencyStore.markProcessed).toHaveBeenCalledWith(response.id);
  });

  it('duplicate delivery does not notify twice', async () => {
    const dto = {
      payload: { chatId: '1', text: 'once' },
    };

    await producerService.publishEvent(dto);
    await consumerService.handle(publishedEvent!);

    notifiedPayload = undefined;
    idempotencyStore.hasProcessed.mockReturnValue(true);

    await consumerService.handle(publishedEvent!);

    expect(notifiedPayload).toBeUndefined();
    expect(idempotencyStore.markProcessed).toHaveBeenCalledTimes(1);
  });

  it('notifier failure leaves event unmarked for retry', async () => {
    const notifyMock = jest
      .fn()
      .mockRejectedValueOnce(new Error('Telegram unavailable'))
      .mockResolvedValueOnce(undefined);

    const module = await Test.createTestingModule({
      providers: [
        ConsumerService,
        { provide: NOTIFIER_CLIENT, useValue: { notify: notifyMock } },
        { provide: IDEMPOTENCY_STORE, useValue: idempotencyStore },
      ],
    }).compile();

    const consumer = module.get(ConsumerService);
    const event = (
      await Test.createTestingModule({
        providers: [
          ProducerService,
          {
            provide: EVENT_PUBLISHER,
            useValue: { publish: jest.fn() },
          },
        ],
      }).compile()
    )
      .get(ProducerService)
      .buildEvent({ payload: { chatId: '2', text: 'retry' } });

    await expect(consumer.handle(event)).rejects.toThrow(
      'Telegram unavailable',
    );
    expect(idempotencyStore.markProcessed).not.toHaveBeenCalled();

    idempotencyStore.hasProcessed.mockReturnValue(false);
    await consumer.handle(event);
    expect(notifyMock).toHaveBeenCalledTimes(2);
    expect(idempotencyStore.markProcessed).toHaveBeenCalledWith(event.id);
  });
});
