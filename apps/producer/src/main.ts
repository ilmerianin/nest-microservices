import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ProducerModule } from './producer.module';

async function bootstrap() {
  const app = await NestFactory.create(ProducerModule);

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Producer API')
    .setDescription(
      'HTTP API для публикации событий уведомлений в RabbitMQ. ' +
        'Swagger UI: `/api`',
    )
    .setVersion('1.0')
    .addServer('http://localhost:3000', 'Local development')
    .addServer('http://localhost:3000', 'Docker (port 3000)')
    .addTag('events', 'Публикация событий')
    .addTag('health', 'Проверка готовности сервиса')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
}
bootstrap();
