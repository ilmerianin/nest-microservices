import { Test, TestingModule } from '@nestjs/testing';
import { NOTIFICATION_SENDER } from '@app/common';
import { NotifierService } from './notifier.service';

describe('NotifierService', () => {
  let service: NotifierService;
  let sendMessageMock: jest.Mock;

  beforeEach(async () => {
    sendMessageMock = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotifierService,
        {
          provide: NOTIFICATION_SENDER,
          useValue: { sendMessage: sendMessageMock },
        },
      ],
    }).compile();

    service = module.get(NotifierService);
  });

  it('delegates sendNotification to NOTIFICATION_SENDER', async () => {
    await service.sendNotification({ chatId: '99', text: 'hello' });

    expect(sendMessageMock).toHaveBeenCalledWith('99', 'hello');
  });

  it('propagates sender errors', async () => {
    sendMessageMock.mockRejectedValue(new Error('telegram down'));

    await expect(
      service.sendNotification({ chatId: '1', text: 'x' }),
    ).rejects.toThrow('telegram down');
  });
});
