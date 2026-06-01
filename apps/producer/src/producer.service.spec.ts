import { Test, TestingModule } from '@nestjs/testing';
import { EventType } from '@app/common';
import { ProducerService } from './producer.service';

describe('ProducerService', () => {
  let service: ProducerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProducerService],
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
});
