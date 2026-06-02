import { Test, TestingModule } from '@nestjs/testing';
import {
  EVENT_PUBLISHER,
  EventDto,
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

  beforeEach(async () => {
    publishedEvent = undefined;
    notifiedPayload = undefined;

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

    const result = await consumerService.processEvent(publishedEvent!);

    expect(result).toBe('processed');
    expect(notifiedPayload).toEqual(dto.payload);
  });

  it('duplicate delivery does not notify twice', async () => {
    const dto = {
      payload: { chatId: '1', text: 'once' },
    };

    await producerService.publishEvent(dto);
    await consumerService.processEvent(publishedEvent!);

    notifiedPayload = undefined;
    const duplicateResult = await consumerService.processEvent(publishedEvent!);

    expect(duplicateResult).toBe('duplicate');
    expect(notifiedPayload).toBeUndefined();
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

    await expect(consumer.processEvent(event)).rejects.toThrow(
      'Telegram unavailable',
    );
    expect(consumer.isAlreadyProcessed(event)).toBe(false);

    const retryResult = await consumer.processEvent(event);
    expect(retryResult).toBe('processed');
    expect(notifyMock).toHaveBeenCalledTimes(2);
  });
});
