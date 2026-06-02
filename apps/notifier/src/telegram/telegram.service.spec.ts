import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  TelegramApiError,
  TelegramNetworkError,
  TelegramRateLimitError,
  TelegramUnauthorizedError,
} from './telegram.errors';
import * as telegramHttp from './telegram-http.client';
import { TelegramService } from './telegram.service';

jest.mock('./telegram-http.client');

describe('TelegramService', () => {
  let service: TelegramService;
  const postJson = telegramHttp.postJson as jest.MockedFunction<
    typeof telegramHttp.postJson
  >;

  beforeEach(async () => {
    postJson.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelegramService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('test-token'),
            get: jest.fn().mockReturnValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get(TelegramService);
  });

  it('formatMessage adds TgRabbit prefix', () => {
    expect(service.formatMessage('hello')).toBe('[TgRabbit]\nhello');
  });

  it('sendMessage calls Telegram API on success', async () => {
    postJson.mockResolvedValue({
      status: 200,
      body: { ok: true },
    });

    await service.sendMessage('123', 'hello');

    expect(postJson).toHaveBeenCalledWith(
      'https://api.telegram.org/bottest-token/sendMessage',
      {
        chat_id: '123',
        text: '[TgRabbit]\nhello',
      },
      15_000,
    );
  });

  it('throws TelegramUnauthorizedError on 401', async () => {
    postJson.mockResolvedValue({
      status: 401,
      body: {
        ok: false,
        error_code: 401,
        description: 'Unauthorized',
      },
    });

    await expect(service.sendMessage('1', 'x')).rejects.toBeInstanceOf(
      TelegramUnauthorizedError,
    );
  });

  it('retries on 429 and succeeds', async () => {
    jest.useFakeTimers({ advanceTimers: true });

    postJson
      .mockResolvedValueOnce({
        status: 429,
        body: {
          ok: false,
          error_code: 429,
          description: 'Too Many Requests',
          parameters: { retry_after: 1 },
        },
      })
      .mockResolvedValueOnce({
        status: 200,
        body: { ok: true },
      });

    const promise = service.sendMessage('1', 'retry-test');
    await jest.advanceTimersByTimeAsync(1000);
    await promise;

    expect(postJson).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });

  it('throws TelegramRateLimitError after max retries on 429', async () => {
    jest.useFakeTimers({ advanceTimers: true });

    postJson.mockResolvedValue({
      status: 429,
      body: {
        ok: false,
        error_code: 429,
        description: 'Too Many Requests',
        parameters: { retry_after: 1 },
      },
    });

    const promise = service.sendMessage('1', 'x');
    const expectation = expect(promise).rejects.toBeInstanceOf(
      TelegramRateLimitError,
    );

    await jest.advanceTimersByTimeAsync(1000);
    await jest.advanceTimersByTimeAsync(1000);
    await jest.advanceTimersByTimeAsync(1000);
    await expectation;

    jest.useRealTimers();
  });

  it('buildSendMessageUrl uses TELEGRAM_API_BASE_URL when set', () => {
    const config = service['configService'] as ConfigService;
    (config.get as jest.Mock).mockReturnValue('http://localhost:8081');

    expect(service.buildSendMessageUrl()).toBe(
      'http://localhost:8081/bottest-token/sendMessage',
    );
  });

  it('throws TelegramNetworkError when HTTP request fails', async () => {
    jest.useFakeTimers({ advanceTimers: true });

    postJson.mockRejectedValue(
      Object.assign(new Error('connect ETIMEDOUT'), {
        code: 'ETIMEDOUT',
      }),
    );

    const promise = service.sendMessage('1', 'x');
    const expectation = expect(promise).rejects.toBeInstanceOf(
      TelegramNetworkError,
    );

    await jest.advanceTimersByTimeAsync(1000);
    await jest.advanceTimersByTimeAsync(2000);
    await jest.advanceTimersByTimeAsync(4000);
    await jest.advanceTimersByTimeAsync(8000);
    await expectation;

    expect(postJson).toHaveBeenCalledTimes(5);
    jest.useRealTimers();
  });

  it('throws TelegramApiError on other API failures', async () => {
    postJson.mockResolvedValue({
      status: 400,
      body: {
        ok: false,
        error_code: 400,
        description: 'Bad Request: chat not found',
      },
    });

    await expect(service.sendMessage('bad', 'x')).rejects.toBeInstanceOf(
      TelegramApiError,
    );
  });
});
