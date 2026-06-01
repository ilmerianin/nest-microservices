import 'reflect-metadata';

process.env.RABBITMQ_URL ??= 'amqp://localhost:5672';
process.env.RABBITMQ_QUEUE ??= 'events.notifications';
process.env.NOTIFIER_URL ??= 'http://localhost:3001';
process.env.TELEGRAM_BOT_TOKEN ??= 'test-token';
