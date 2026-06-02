import { Test, TestingModule } from '@nestjs/testing';
import {
  IDEMPOTENCY_STORE,
  IIdempotencyStore,
  NOTIFIER_CLIENT,
  createNotificationEvent,
} from '@app/common';
import { ConsumerService } from './consumer.service';

describe('ConsumerService', () => {
  let service: ConsumerService;
  let notifyMock: jest.Mock;
  let idempotencyStore: jest.Mocked<IIdempotencyStore>;

  beforeEach(async () => {
    notifyMock = jest.fn().mockResolvedValue(undefined);
    idempotencyStore = {
      hasProcessed: jest.fn().mockReturnValue(false),
      markProcessed: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsumerService,
        { provide: NOTIFIER_CLIENT, useValue: { notify: notifyMock } },
        { provide: IDEMPOTENCY_STORE, useValue: idempotencyStore },
      ],
    }).compile();

    service = module.get<ConsumerService>(ConsumerService);
  });

  it('processes new event and delegates to notifier', async () => {
    const event = createNotificationEvent({
      payload: { chatId: '1', text: 'hi' },
    });

    await service.handle(event);

    expect(notifyMock).toHaveBeenCalledWith(event.payload);
    expect(idempotencyStore.markProcessed).toHaveBeenCalledWith(event.id);
  });

  it('skips duplicate events without calling notifier', async () => {
    const event = createNotificationEvent({
      payload: { chatId: '1', text: 'hi' },
    });

    idempotencyStore.hasProcessed.mockReturnValue(true);

    await service.handle(event);

    expect(notifyMock).not.toHaveBeenCalled();
    expect(idempotencyStore.markProcessed).not.toHaveBeenCalled();
  });

  it('does not mark as processed when notifier fails', async () => {
    notifyMock.mockRejectedValue(new Error('notifier down'));
    const event = createNotificationEvent({
      payload: { chatId: '1', text: 'hi' },
    });

    await expect(service.handle(event)).rejects.toThrow('notifier down');
    expect(idempotencyStore.markProcessed).not.toHaveBeenCalled();
  });
});
