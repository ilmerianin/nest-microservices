import { Test, TestingModule } from '@nestjs/testing';
import { EVENT_PUBLISHER, EventType, IEventPublisher } from '@app/common';
import { ProducerService } from './producer.service';

describe('ProducerService', () => {
  let service: ProducerService;
  let publisher: jest.Mocked<IEventPublisher>;

  beforeEach(async () => {
    publisher = { publish: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProducerService,
        { provide: EVENT_PUBLISHER, useValue: publisher },
      ],
    }).compile();

    service = module.get<ProducerService>(ProducerService);
  });

  it('buildEvent returns notification event with UUID', () => {
    const event = service.buildEvent({
      payload: { chatId: '123', text: 'test' },
    });

    expect(event.type).toBe(EventType.NOTIFICATION_REQUESTED);
    expect(event.payload.chatId).toBe('123');
    expect(event.id).toBeDefined();
    expect(event.createdAt).toBeDefined();
  });

  it('publishEvent returns id and published status', async () => {
    const result = await service.publishEvent({
      payload: { chatId: '123', text: 'test' },
    });

    expect(result.status).toBe('published');
    expect(result.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(publisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        id: result.id,
        type: EventType.NOTIFICATION_REQUESTED,
        payload: { chatId: '123', text: 'test' },
      }),
    );
  });

  it('rethrows publish errors', async () => {
    publisher.publish.mockRejectedValue(new Error('broker down'));

    await expect(
      service.publishEvent({ payload: { chatId: '1', text: 'x' } }),
    ).rejects.toThrow('broker down');
  });
});
