interface IGenerator {
  start(): Promise<void>;
  stop(): void;
}

export { IGenerator };
