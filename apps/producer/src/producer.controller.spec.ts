import { Test, TestingModule } from '@nestjs/testing';
import { EVENT_PUBLISHER } from '@app/common';
import { ProducerController } from './producer.controller';
import { ProducerService } from './producer.service';

describe('ProducerController', () => {
  let controller: ProducerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProducerController],
      providers: [
        ProducerService,
        {
          provide: EVENT_PUBLISHER,
          useValue: { publish: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    controller = module.get<ProducerController>(ProducerController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(controller.getHello()).toBe('Hello World!');
    });
  });

  describe('publishEvent', () => {
    it('returns published response', async () => {
      const result = await controller.publishEvent({
        payload: { chatId: '99', text: 'hi' },
      });

      expect(result.status).toBe('published');
      expect(result.id).toBeDefined();
    });
  });
});
