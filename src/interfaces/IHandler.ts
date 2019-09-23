interface IHandler {
  pushError(message: string): Promise<number>;
  incCounter(): Promise<number>;
  isValid(value: number): boolean;
}

export { IHandler };
