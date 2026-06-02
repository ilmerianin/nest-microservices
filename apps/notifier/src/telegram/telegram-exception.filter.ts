import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import {
  TelegramApiError,
  TelegramNetworkError,
  TelegramRateLimitError,
  TelegramUnauthorizedError,
} from '../telegram/telegram.errors';

@Catch(TelegramApiError)
export class TelegramExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(TelegramExceptionFilter.name);

  catch(exception: TelegramApiError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof TelegramUnauthorizedError) {
      this.logger.error(exception.message);
      response.status(HttpStatus.UNAUTHORIZED).json({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: exception.message,
        error: 'Telegram Unauthorized',
      });
      return;
    }

    if (exception instanceof TelegramRateLimitError) {
      this.logger.warn(exception.message);
      response.status(HttpStatus.TOO_MANY_REQUESTS).json({
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: exception.message,
        error: 'Telegram Rate Limit',
        retryAfterSeconds: exception.retryAfterSeconds,
      });
      return;
    }

    if (exception instanceof TelegramNetworkError) {
      this.logger.error(exception.message);
      response.status(HttpStatus.BAD_GATEWAY).json({
        statusCode: HttpStatus.BAD_GATEWAY,
        message: exception.message,
        error: 'Telegram Network Error',
      });
      return;
    }

    this.logger.error(exception.message);
    response.status(HttpStatus.BAD_GATEWAY).json({
      statusCode: HttpStatus.BAD_GATEWAY,
      message: exception.message,
      error: 'Telegram API Error',
    });
  }
}
