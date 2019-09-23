import { IHandler } from '../interfaces';
import { ClientOpts, RedisClient } from 'redis';
import { Logger } from '../utils';

class Handler implements IHandler {
  private client: RedisClient;

  private errorListKey: string = 'error-list';
  private counterKey: string = 'counter';

  constructor(createClient: (options?: ClientOpts) => RedisClient) {
    this.errorListKey = process.env.ERROR_LIST_KEY;
    this.counterKey = process.env.COUNTER_KEY;

    this.client = createClient({
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
      password: process.env.REDIS_PASSWORD,
    });

    this.client.on('error', ({ message, stack }) => Logger.error('QueueClient error', { message, stack }));
  }

  public async pushError(message: string): Promise<number> {
    return new Promise((resolve, reject) => {
      this.client.LPUSH(this.errorListKey, message, (error, result) => {
        if (error) {
          Logger.error('Push Error error', error);
          reject(error);
        }

        Logger.info('Error pushed', { message });
        resolve(result);
      });
    });
  }

  public isValid(value: number): boolean {
    return value <= 8;
  }

  public async incCounter(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.client.INCR(this.counterKey, (error, result) => {
        if (error) {
          Logger.error('Increase counter error', error);
          reject(error);
        }

        Logger.info('Increased', { counter: result });
        resolve(result);
      });
    });
  }
}

export { Handler };
