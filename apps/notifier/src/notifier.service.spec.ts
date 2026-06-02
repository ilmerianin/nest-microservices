import { Test, TestingModule } from '@nestjs/testing';
import { NotifierService } from './notifier.service';
import { TelegramService } from './telegram/telegram.service';

describe('NotifierService', () => {
  let service: NotifierService;
  let telegramService: jest.Mocked<Pick<TelegramService, 'sendMessage'>>;

  beforeEach(async () => {
    telegramService = { sendMessage: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotifierService,
        { provide: TelegramService, useValue: telegramService },
      ],
    }).compile();

    service = module.get(NotifierService);
  });

  it('delegates sendNotification to TelegramService', async () => {
    await service.sendNotification({ chatId: '99', text: 'hello' });

    expect(telegramService.sendMessage).toHaveBeenCalledWith('99', 'hello');
  });

  it('propagates Telegram errors', async () => {
    telegramService.sendMessage.mockRejectedValue(new Error('telegram down'));

    await expect(
      service.sendNotification({ chatId: '1', text: 'x' }),
    ).rejects.toThrow('telegram down');
  });
});
