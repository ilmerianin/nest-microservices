import { Test, TestingModule } from '@nestjs/testing';
import { IDEMPOTENCY_STORE, NOTIFIER_CLIENT } from '@app/common';
import { ConsumerController } from './consumer.controller';
import { ConsumerService } from './consumer.service';

describe('ConsumerController', () => {
  let consumerController: ConsumerController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ConsumerController],
      providers: [
        ConsumerService,
        { provide: NOTIFIER_CLIENT, useValue: { notify: jest.fn() } },
        {
          provide: IDEMPOTENCY_STORE,
          useValue: { hasProcessed: jest.fn(), markProcessed: jest.fn() },
        },
      ],
    }).compile();

    consumerController = app.get<ConsumerController>(ConsumerController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(consumerController.getHello()).toBe('Hello World!');
    });
  });
});
