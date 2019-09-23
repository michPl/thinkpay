import { Logger } from '../utils';
import { IQueueClient, IGenerator, IHandler } from '../interfaces';
import { ClientOpts, RedisClient } from 'redis';

class Switcher {
  private client: RedisClient;
  private ttlSeconds: number;
  private generatorKey: string;
  private isGenerator: boolean = false;

  constructor(
    private queueClient: IQueueClient,
    private handler: IHandler,
    private generator: IGenerator,
    createClient: (options?: ClientOpts) => RedisClient
  ) {
    this.ttlSeconds = Number(process.env.MAX_TTL_WITHOUT_GENERATOR);
    this.generatorKey = process.env.GENERATOR_KEY;

    this.client = createClient({
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
      password: process.env.REDIS_PASSWORD,
    });

    this.client.on('error', ({ message, stack }) => Logger.error('QueueClient error', { message, stack }));
  }

  private updateGeneratorTtl(id: string) {
    return new Promise((resolve, reject) => {
      if (id !== String(process.pid)) return resolve();

      this.client
        .multi()
        .expire(this.generatorKey, this.ttlSeconds)
        .exec((error, result) => error ? reject(error) : resolve());
    });
  }

  private setGenerator() {
    return new Promise((resolve, reject) => {
      this.client
        .multi()
        .setex(this.generatorKey, this.ttlSeconds, String(process.pid))
        .exec((error, result) => {
          if (error) {
            Logger.error('Setting generator error', error);
            return reject(error);
          }

          this.isGenerator = !!result;
          resolve();
        });
    });
  }

  private getCurrentGenerator(): Promise<string> {
    return new Promise((resolve, reject) =>
      this.client.get(this.generatorKey, (error, id) => error ? reject(error) : resolve(id))
    );
  }

  private async chooseRole() {
    return new Promise((resolve, reject) => {
      this.client.watch(this.generatorKey, async (error) => {
        if (error) {
          Logger.error('Starting watch error', error);
          return reject(error);
        }

        try {
          const id = await this.getCurrentGenerator();

          if (id) {
            await this.updateGeneratorTtl(id);
            return resolve();
          }

          await this.setGenerator();
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  private async start() {
    await this.chooseRole();

    if (this.isGenerator) {
      await this.generator.start();

      return null;
    }

    return this.queueClient.getMessage();
  }

  public async init() {
    while (true) {
      const result = await this.start();

      if (!this.isGenerator && result) {
        this.handler.isValid(Number(result)) ?
          await this.handler.incCounter() :
          await this.handler.pushError(`${result} is wrong`);
      }
    }
  }
}

export { Switcher };
