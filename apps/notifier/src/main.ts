import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { NotifierModule } from './notifier.module';

async function bootstrap() {
  const app = await NestFactory.create(NotifierModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);
  await app.listen(port);
}
bootstrap();
