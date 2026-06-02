import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { INotificationSender } from '@app/common';
import { postJson } from './telegram-http.client';
import {
  TelegramApiError,
  TelegramNetworkError,
  TelegramRateLimitError,
  TelegramUnauthorizedError,
} from './telegram.errors';

interface TelegramApiResponse {
  ok: boolean;
  description?: string;
  error_code?: number;
  parameters?: {
    retry_after?: number;
  };
}

const MAX_RATE_LIMIT_RETRIES = 3;
const MAX_NETWORK_RETRIES = 5;
const FETCH_TIMEOUT_MS = 15_000;
const DEFAULT_TELEGRAM_API_BASE_URL = 'https://api.telegram.org';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  const errno = error as NodeJS.ErrnoException;
  const cause = errno.cause;
  const causeCode =
    cause && typeof cause === 'object' && 'code' in cause
      ? String((cause as { code?: string }).code)
      : '';
  const code = errno.code ?? causeCode;

  return (
    message.includes('fetch failed') ||
    message.includes('network') ||
    message.includes('econnreset') ||
    code === 'ETIMEDOUT' ||
    code === 'ENETUNREACH' ||
    code === 'ECONNREFUSED' ||
    code === 'ECONNRESET' ||
    code === 'EPIPE' ||
    code === 'EAI_AGAIN'
  );
}

@Injectable()
export class TelegramService implements INotificationSender {
  private readonly logger = new Logger(TelegramService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendMessage(chatId: string, text: string): Promise<void> {
    for (let attempt = 1; attempt <= MAX_NETWORK_RETRIES; attempt++) {
      try {
        await this.callTelegramApi(chatId, text, 1);
        return;
      } catch (error) {
        if (!(error instanceof TelegramNetworkError)) {
          throw error;
        }

        if (attempt >= MAX_NETWORK_RETRIES) {
          throw error;
        }

        const delayMs = 1_000 * Math.pow(2, attempt - 1);
        this.logger.warn(
          `Telegram network retry ${attempt}/${MAX_NETWORK_RETRIES} in ${delayMs}ms: ${error.message}`,
        );
        await sleep(delayMs);
      }
    }
  }

  formatMessage(text: string): string {
    return `[TgRabbit]\n${text}`;
  }

  buildSendMessageUrl(): string {
    const token = this.configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN');
    const baseUrl = (
      this.configService.get<string>('TELEGRAM_API_BASE_URL') ??
      DEFAULT_TELEGRAM_API_BASE_URL
    ).replace(/\/$/, '');

    return `${baseUrl}/bot${token}/sendMessage`;
  }

  private async callTelegramApi(
    chatId: string,
    text: string,
    rateLimitAttempt: number,
  ): Promise<void> {
    const url = this.buildSendMessageUrl();

    let status: number;
    let body: TelegramApiResponse;

    try {
      const response = await postJson<TelegramApiResponse>(
        url,
        {
          chat_id: chatId,
          text: this.formatMessage(text),
        },
        FETCH_TIMEOUT_MS,
      );
      status = response.status;
      body = response.body;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new TelegramNetworkError(
          `Telegram API returned non-JSON response. ` +
            'Check TELEGRAM_API_BASE_URL or network/proxy settings.',
        );
      }

      throw this.toNetworkError(error);
    }

    if (body.ok) {
      this.logger.log(`Telegram message sent: chatId=${chatId}`);
      return;
    }

    const description = body.description ?? 'Unknown Telegram API error';
    const errorCode = body.error_code;

    if (errorCode === 401 || errorCode === 404) {
      throw new TelegramUnauthorizedError(
        `Invalid Telegram bot token or bot not found: ${description}`,
        errorCode,
      );
    }

    if (errorCode === 429) {
      const retryAfter = body.parameters?.retry_after ?? 1;

      if (rateLimitAttempt >= MAX_RATE_LIMIT_RETRIES) {
        throw new TelegramRateLimitError(
          `Telegram rate limit exceeded after ${rateLimitAttempt} attempts: ${description}`,
          retryAfter,
        );
      }

      this.logger.warn(
        `Telegram rate limit (429), retry ${rateLimitAttempt}/${MAX_RATE_LIMIT_RETRIES} after ${retryAfter}s`,
      );
      await sleep(retryAfter * 1000);
      return this.callTelegramApi(chatId, text, rateLimitAttempt + 1);
    }

    throw new TelegramApiError(
      `Telegram API error: ${description}`,
      status,
      errorCode,
    );
  }

  private toNetworkError(error: unknown): TelegramNetworkError {
    if (error instanceof TelegramApiError) {
      throw error;
    }

    const baseMessage =
      'Cannot reach Telegram API. Check internet access, VPN, firewall, or set TELEGRAM_API_BASE_URL to a local Bot API server.';

    if (error instanceof Error) {
      const errno = error as NodeJS.ErrnoException;
      const cause = errno.cause;
      const causeDetails =
        cause instanceof Error
          ? `${cause.message}${'code' in cause ? ` (${String(cause.code)})` : ''}`
          : undefined;
      const codeSuffix = errno.code ? ` (${errno.code})` : '';

      const detail = causeDetails ?? `${error.message}${codeSuffix}`;
      return new TelegramNetworkError(`${baseMessage} Details: ${detail}`);
    }

    return new TelegramNetworkError(baseMessage);
  }
}

export { isRetryableNetworkError };
