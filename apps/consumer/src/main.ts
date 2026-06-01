import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ConsumerModule } from './consumer.module';

async function bootstrap() {
  const app = await NestFactory.create(ConsumerModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3002);
  await app.listen(port);
}
bootstrap();
