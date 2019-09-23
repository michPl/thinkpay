import { IQueueClient, IGenerator } from '../interfaces';
import { Logger } from '../utils';

class Generator implements IGenerator {
  private minValue: number;
  private maxValue: number;
  private frequency: number;
  private intervalId: NodeJS.Timeout;
  private started: boolean = false;

  constructor(private client: IQueueClient) {
    this.minValue = Number(process.env.GENERATOR_MIN_VALUE || 0);
    this.maxValue = Number(process.env.GENERATOR_MAX_VALUE || 10);
    this.frequency = Number(process.env.GENERATOR_FREQUENCY_MILLISECONDS || 1000);
  }

  private generate() {
    return Math.floor(Math.random() * (this.maxValue - this.minValue + 1)) + this.minValue;
  }

  private async send() {
    return this.client.pushNewMessage(this.generate());
  }

  public async start() {
    if (this.started) return;

    Logger.info('Starting generate values');
    await this.send();
    this.intervalId = setInterval(this.send.bind(this), this.frequency);
    this.started = true;
  }

  public stop() {
    clearInterval(this.intervalId);
    this.started = false;
    Logger.info('Generating stoped');
  }
}

export { Generator };
