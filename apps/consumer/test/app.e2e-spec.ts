import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ConsumerModule } from './../src/consumer.module';
import { RabbitMqConsumerService } from './../src/rabbitmq/rabbitmq-consumer.service';

describe('ConsumerController (e2e)', () => {
  let app: INestApplication;

  const rabbitMqMock = {
    onModuleInit: jest.fn(),
    onModuleDestroy: jest.fn(),
    isConnected: jest.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ConsumerModule],
    })
      .overrideProvider(RabbitMqConsumerService)
      .useValue(rabbitMqMock)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('GET /health returns ok when dependencies configured', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('ok');
        expect(body.service).toBe('consumer');
        expect(body.checks.rabbitmq).toBeDefined();
        expect(body.checks.notifier).toBeDefined();
      });
  });
});
