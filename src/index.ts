import dotenv from 'dotenv';
import { createClient } from 'redis';
import { QueueClient, Generator, Handler, Switcher } from './services';
import { Logger } from './utils';

dotenv.config();
process.on('unhandledRejection', (reason) => Logger.error('Unhandled Rejection', { reason }));

const queueClient = new QueueClient(createClient);
const handler = new Handler(createClient);
const generator = new Generator(queueClient);
const switcher = new Switcher(queueClient, handler, generator, createClient);

switcher.init();
