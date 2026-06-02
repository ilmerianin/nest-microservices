import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { EVENT_PUBLISHER } from '@app/common';
import request from 'supertest';
import { ProducerModule } from './../src/producer.module';
import { RabbitMqPublisherService } from './../src/rabbitmq/rabbitmq-publisher.service';

describe('ProducerController (e2e)', () => {
  let app: INestApplication;
  const publishMock = jest.fn().mockResolvedValue(undefined);
  const publisherMock = {
    publish: publishMock,
    isConnected: jest.fn().mockReturnValue(true),
    onModuleInit: jest.fn(),
    onModuleDestroy: jest.fn(),
  };

  beforeEach(async () => {
    publishMock.mockClear();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ProducerModule],
    })
      .overrideProvider(RabbitMqPublisherService)
      .useValue(publisherMock)
      .overrideProvider(EVENT_PUBLISHER)
      .useValue(publisherMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
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

  it('GET /health returns ok when RabbitMQ is connected', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('ok');
        expect(body.service).toBe('producer');
        expect(body.checks.rabbitmq).toBe('up');
      });
  });

  it('POST /events publishes event and returns id', () => {
    return request(app.getHttpServer())
      .post('/events')
      .send({ payload: { chatId: '123456789', text: 'Test message' } })
      .expect(201)
      .expect(({ body }) => {
        expect(body.status).toBe('published');
        expect(body.id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        );
      })
      .then(() => {
        expect(publishMock).toHaveBeenCalledTimes(1);
        expect(publishMock.mock.calls[0][0].payload).toEqual({
          chatId: '123456789',
          text: 'Test message',
        });
      });
  });

  it('POST /events rejects invalid payload', () => {
    return request(app.getHttpServer())
      .post('/events')
      .send({ payload: { chatId: '', text: '' } })
      .expect(400);
  });
});
