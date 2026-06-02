import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotifierClientService } from './notifier-client.service';

describe('NotifierClientService', () => {
  let service: NotifierClientService;

  beforeEach(async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 202,
      statusText: 'Accepted',
      text: async () => '',
    }) as jest.Mock;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotifierClientService,
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn().mockReturnValue('http://localhost:3001') },
        },
      ],
    }).compile();

    service = module.get(NotifierClientService);
  });

  it('POSTs payload to NOTIFIER_URL/notify', async () => {
    await service.notify({ chatId: '123', text: 'hello' });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3001/notify',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ chatId: '123', text: 'hello' }),
      }),
    );
  });

  it('throws when notifier responds with error', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: async () => 'fail',
    });

    await expect(
      service.notify({ chatId: '1', text: 'x' }),
    ).rejects.toThrow('Notifier request failed');
  });
});
