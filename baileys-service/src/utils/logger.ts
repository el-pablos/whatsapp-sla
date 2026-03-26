import pino, { Logger, LoggerOptions } from "pino";
import { config } from "../config";

const loggerOptions: LoggerOptions = {
  level: config.baileys.logLevel,
  transport:
    config.nodeEnv !== "production"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        }
      : undefined,
  base: {
    service: "baileys-service",
    version: "1.0.0",
  },
};

export const logger: Logger = pino(loggerOptions);

export function createChildLogger(name: string): Logger {
  return logger.child({ component: name });
}

export const socketLogger = createChildLogger("socket");
export const authLogger = createChildLogger("auth");
export const connectionLogger = createChildLogger("connection");
export const messageLogger = createChildLogger("message");
export const apiLogger = createChildLogger("api");

export default logger;
