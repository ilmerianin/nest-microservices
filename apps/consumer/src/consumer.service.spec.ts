import { Test, TestingModule } from '@nestjs/testing';
import { EventType, createNotificationEvent } from '@app/common';
import { ConsumerService } from './consumer.service';

describe('ConsumerService', () => {
  let service: ConsumerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConsumerService],
    }).compile();

    service = module.get<ConsumerService>(ConsumerService);
  });

  it('isAlreadyProcessed returns false for new event', () => {
    const event = createNotificationEvent({
      payload: { chatId: '1', text: 'hi' },
    });

    expect(service.isAlreadyProcessed(event)).toBe(false);
  });

  it('isAlreadyProcessed returns true after markAsProcessed', () => {
    const event = createNotificationEvent({
      payload: { chatId: '1', text: 'hi' },
    });

    service.markAsProcessed(event);
    expect(service.isAlreadyProcessed(event)).toBe(true);
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
