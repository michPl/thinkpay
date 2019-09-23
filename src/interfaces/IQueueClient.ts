interface IQueueClient {
  ownQueueKey: string;
  pushNewMessage(message: number): Promise<number>;
  getMessage(): Promise<string>;
  clearOwnQueue(): Promise<any>;
}

export { IQueueClient };
