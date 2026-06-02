import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NotifierModule } from './notifier.module';

async function bootstrap() {
  const app = await NestFactory.create(NotifierModule);

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Notifier API')
    .setDescription(
      'HTTP API для отправки уведомлений в Telegram через Bot API. ' +
        'Swagger UI: `/api`',
    )
    .setVersion('1.0')
    .addServer('http://localhost:3001', 'Local development')
    .addServer('http://localhost:3001', 'Docker (port 3001)')
    .addTag('notifications', 'Отправка уведомлений')
    .addTag('health', 'Проверка готовности сервиса')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);
  await app.listen(port);
}
bootstrap();
