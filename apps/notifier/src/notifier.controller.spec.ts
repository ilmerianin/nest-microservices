import { Test, TestingModule } from '@nestjs/testing';
import { NotifierController } from './notifier.controller';
import { NotifierService } from './notifier.service';

describe('NotifierController', () => {
  let notifierController: NotifierController;
  let notifierService: jest.Mocked<
    Pick<NotifierService, 'sendNotification' | 'getHello'>
  >;

  beforeEach(async () => {
    notifierService = {
      sendNotification: jest.fn().mockResolvedValue(undefined),
      getHello: jest.fn().mockReturnValue('Hello World!'),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [NotifierController],
      providers: [{ provide: NotifierService, useValue: notifierService }],
    }).compile();

    notifierController = app.get<NotifierController>(NotifierController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(notifierController.getHello()).toBe('Hello World!');
    });
  });

  describe('notify', () => {
    it('returns sent status with chatId', async () => {
      const result = await notifierController.notify({
        chatId: '123',
        text: 'hello',
      });

      expect(result).toEqual({ status: 'sent', chatId: '123' });
      expect(notifierService.sendNotification).toHaveBeenCalledWith({
        chatId: '123',
        text: 'hello',
      });
    });
  });
});
