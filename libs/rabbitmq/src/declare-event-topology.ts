import { ConfirmChannel } from 'amqplib';
import {
  RABBITMQ_DLQ,
  RABBITMQ_DLQ_ROUTING_KEY,
  RABBITMQ_EXCHANGE,
  RABBITMQ_ROUTING_KEY,
} from '@app/contracts';

/** Единое объявление exchange/queue/DLQ для Producer и Consumer. */
export async function declareEventTopology(
  channel: ConfirmChannel,
  queueName: string,
): Promise<void> {
  await channel.assertExchange(RABBITMQ_EXCHANGE, 'topic', { durable: true });

  await channel.assertQueue(RABBITMQ_DLQ, { durable: true });
  await channel.bindQueue(
    RABBITMQ_DLQ,
    RABBITMQ_EXCHANGE,
    RABBITMQ_DLQ_ROUTING_KEY,
  );

  await channel.assertQueue(queueName, {
    durable: true,
    deadLetterExchange: RABBITMQ_EXCHANGE,
    deadLetterRoutingKey: RABBITMQ_DLQ_ROUTING_KEY,
  });
  await channel.bindQueue(queueName, RABBITMQ_EXCHANGE, RABBITMQ_ROUTING_KEY);
}
