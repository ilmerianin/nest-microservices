import { RabbitMqConsumeRetryPolicy } from './rabbitmq-consume-retry.policy';
import { ConfirmChannel, ConsumeMessage } from 'amqplib';

describe('RabbitMqConsumeRetryPolicy', () => {
  let policy: RabbitMqConsumeRetryPolicy;
  let channel: jest.Mocked<Pick<ConfirmChannel, 'ack' | 'nack' | 'publish'>>;

  beforeEach(() => {
    policy = new RabbitMqConsumeRetryPolicy();
    channel = {
      ack: jest.fn(),
      nack: jest.fn(),
      publish: jest.fn(),
    };
  });

  function buildMessage(headers: Record<string, unknown> = {}): ConsumeMessage {
    return {
      content: Buffer.from('{}'),
      properties: {
        messageId: 'event-1',
        contentType: 'application/json',
        headers,
      },
    } as ConsumeMessage;
  }

  it('requeues with incremented retry header on transient failure', () => {
    policy.handleFailure(buildMessage(), channel as ConfirmChannel, 'event-1');

    expect(channel.publish).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.any(Buffer),
      expect.objectContaining({
        headers: expect.objectContaining({ 'x-retry-count': 1 }),
      }),
    );
    expect(channel.ack).toHaveBeenCalledTimes(1);
    expect(channel.nack).not.toHaveBeenCalled();
  });

  it('nacks to DLQ after max retries', () => {
    policy.handleFailure(
      buildMessage({ 'x-retry-count': 2 }),
      channel as ConfirmChannel,
      'event-1',
    );

    expect(channel.nack).toHaveBeenCalledWith(
      expect.anything(),
      false,
      false,
    );
    expect(channel.publish).not.toHaveBeenCalled();
  });

  it('getRetryCount reads x-retry-count header', () => {
    expect(policy.getRetryCount(buildMessage({ 'x-retry-count': 2 }))).toBe(2);
    expect(policy.getRetryCount(buildMessage())).toBe(0);
  });
});
