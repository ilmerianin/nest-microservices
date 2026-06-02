/** Имя topic/direct exchange для событий домена. */
export const RABBITMQ_EXCHANGE = 'events';

/** Routing key для запросов на отправку уведомлений. */
export const RABBITMQ_ROUTING_KEY = 'notification.requested';

/** Основная очередь событий (совпадает с дефолтом RABBITMQ_QUEUE в .env). */
export const RABBITMQ_QUEUE = 'events.notifications';

/** Очередь dead-letter для сообщений после исчерпания retry. */
export const RABBITMQ_DLQ = 'events.notifications.dlq';

/** Routing key для dead-letter очереди. */
export const RABBITMQ_DLQ_ROUTING_KEY = 'notification.failed';

/** Максимальное число попыток обработки сообщения consumer'ом. */
export const RABBITMQ_MAX_CONSUME_RETRIES = 3;
