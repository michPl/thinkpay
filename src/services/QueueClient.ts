import { ClientOpts, RedisClient } from 'redis';

import { IQueueClient } from '../interfaces';
import { Logger } from '../utils';

class QueueClient implements IQueueClient {
  private client: RedisClient;
  private workQueueKey: string = 'work';
  public readonly ownQueueKey: string;

  private ttlPopPushRequest: number;

  constructor(createClient: (options?: ClientOpts) => RedisClient) {
    const timeForChecksMS = 2;

    this.workQueueKey = process.env.WORK_QUEUE_KEY;
    this.ttlPopPushRequest = Number(process.env.MAX_TTL_WITHOUT_GENERATOR) - timeForChecksMS;

    this.ownQueueKey = `${this.workQueueKey}:${process.pid}`;

    if (this.ttlPopPushRequest <= 0) {
      throw new Error(`Too small MAX_TTL_WITHOUT_GENERATOR, it must be greater than ${timeForChecksMS}`);
    }

    this.client = createClient({
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
      password: process.env.REDIS_PASSWORD,
    });

    this.client.on('error', ({ message, stack }) => Logger.error('QueueClient error', { message, stack }));
  }

  public async pushNewMessage(message: number): Promise<number> {
    return new Promise((resolve, reject) => {
      this.client.lpush(this.workQueueKey, String(message), (error, result) => {
        if (error) {
          Logger.error('Push new message error', error);
          reject(error);
        }

        Logger.info('Pushed', { message });
        resolve(message);
      });
    });
  }

  public async getMessage(): Promise<string> {
    return new Promise((resolve, reject) =>
      this.client.BRPOPLPUSH(
        this.workQueueKey,
        this.ownQueueKey,
        this.ttlPopPushRequest,
        (error) => {
          if (error) return reject(error);
          this.client.RPOP(
            this.ownQueueKey,
            (err, message) => err ? reject(err) : resolve(message));
        }
      )
    );
  }

  public clearOwnQueue() {
    return new Promise((resolve, reject) =>
      this.client.del(this.ownQueueKey, (error, message) => error ? reject(error) : resolve(message))
    );
  }
}

export { QueueClient };
