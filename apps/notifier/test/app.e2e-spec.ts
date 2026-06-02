import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { NotifierModule } from './../src/notifier.module';
import { TelegramService } from './../src/telegram/telegram.service';

describe('NotifierController (e2e)', () => {
  let app: INestApplication;
  const sendMessageMock = jest.fn().mockResolvedValue(undefined);

  beforeEach(async () => {
    sendMessageMock.mockClear();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [NotifierModule],
    })
      .overrideProvider(TelegramService)
      .useValue({
        sendMessage: sendMessageMock,
        formatMessage: (text: string) => `[TgRabbit]\n${text}`,
      })
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

  it('GET /health returns ok', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('ok');
        expect(body.service).toBe('notifier');
        expect(body.checks.telegram).toBe('up');
      });
  });

  it('POST /notify sends notification via TelegramService', () => {
    return request(app.getHttpServer())
      .post('/notify')
      .send({ chatId: '123456789', text: 'Test' })
      .expect(202)
      .expect({ status: 'sent', chatId: '123456789' })
      .then(() => {
        expect(sendMessageMock).toHaveBeenCalledWith('123456789', 'Test');
      });
  });

  it('POST /notify rejects invalid payload', () => {
    return request(app.getHttpServer())
      .post('/notify')
      .send({ chatId: '', text: '' })
      .expect(400);
  });
});
