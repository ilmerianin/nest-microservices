import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EventType, NOTIFIER_CLIENT, createNotificationEvent } from '@app/common';
import { ConsumerService } from './consumer.service';

describe('ConsumerService', () => {
  let service: ConsumerService;
  let notifyMock: jest.Mock;

  beforeEach(async () => {
    notifyMock = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsumerService,
        { provide: NOTIFIER_CLIENT, useValue: { notify: notifyMock } },
      ],
    }).compile();

    service = module.get<ConsumerService>(ConsumerService);
  });

  it('processes new event and delegates to notifier', async () => {
    const event = createNotificationEvent({
      payload: { chatId: '1', text: 'hi' },
    });

    const result = await service.processEvent(event);

    expect(result).toBe('processed');
    expect(notifyMock).toHaveBeenCalledWith(event.payload);
  });

  it('skips duplicate events without calling notifier', async () => {
    const event = createNotificationEvent({
      payload: { chatId: '1', text: 'hi' },
    });

    await service.processEvent(event);
    notifyMock.mockClear();

    const result = await service.processEvent(event);

    expect(result).toBe('duplicate');
    expect(notifyMock).not.toHaveBeenCalled();
  });

  it('does not mark as processed when notifier fails', async () => {
    notifyMock.mockRejectedValue(new Error('notifier down'));
    const event = createNotificationEvent({
      payload: { chatId: '1', text: 'hi' },
    });

    await expect(service.processEvent(event)).rejects.toThrow('notifier down');
    expect(service.isAlreadyProcessed(event)).toBe(false);
  });

  it('duplicate events with same id are detected', () => {
    const event = createNotificationEvent({
      payload: { chatId: '1', text: 'hi' },
    });

    service.markAsProcessed(event);
    const duplicate = { ...event, type: EventType.NOTIFICATION_REQUESTED };
    expect(service.isAlreadyProcessed(duplicate)).toBe(true);
  });
});
