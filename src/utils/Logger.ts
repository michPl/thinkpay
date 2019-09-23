class Logger {
  public static error(message: string, meta?: object) {
    console.error(message, JSON.stringify({ service_name: process.env.name, ...meta }));
  }

  public static warn(message: string, meta?: object) {
    console.warn(message, JSON.stringify({ service_name: process.env.name, ...meta }));
  }

  public static info(message: string, meta?: object) {
    console.info(message, JSON.stringify({ service_name: process.env.name, ...meta }));
  }

  public static debug(message: string, meta?: object) {
    console.error(message, JSON.stringify({ service_name: process.env.name, ...meta }));
  }
}

export { Logger };
