export class TelegramApiError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly errorCode?: number,
  ) {
    super(message);
    this.name = 'TelegramApiError';
  }
}

export class TelegramUnauthorizedError extends TelegramApiError {
  constructor(message: string, errorCode?: number) {
    super(message, 401, errorCode);
    this.name = 'TelegramUnauthorizedError';
  }
}

export class TelegramRateLimitError extends TelegramApiError {
  constructor(
    message: string,
    readonly retryAfterSeconds: number,
  ) {
    super(message, 429, 429);
    this.name = 'TelegramRateLimitError';
  }
}

/** Сетевая ошибка при обращении к Telegram API (timeout, blocked, DNS). */
export class TelegramNetworkError extends TelegramApiError {
  constructor(message: string) {
    super(message, 502);
    this.name = 'TelegramNetworkError';
  }
}
