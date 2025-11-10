import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';

@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly logger: winston.Logger;
  private context?: string;

  constructor(private readonly configService: ConfigService) {
    const environment =
      this.configService.get<string>('NODE_ENV') ?? 'development';

    const logFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.printf(
        ({ timestamp, level, message, context, trace, ...meta }) => {
          return JSON.stringify({
            timestamp,
            level,
            context: context || this.context,
            message,
            trace,
            ...meta,
          });
        },
      ),
    );

    const transports: winston.transport[] = [];

    // Console transport
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize({ all: true }),
          logFormat,
        ),
      }),
    );

    // File transports for production
    if (environment === 'production') {
      transports.push(
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          maxsize: 5 * 1024 * 1024,
          maxFiles: 5,
          format: logFormat,
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          level: 'info',
          maxsize: 5 * 1024 * 1024,
          maxFiles: 5,
          format: logFormat,
        }),
      );
    }

    this.logger = winston.createLogger({
      level: environment === 'production' ? 'info' : 'debug',
      transports,
    });
  }

  setContext(context: string) {
    this.context = context;
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context: context || this.context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, {
      context: context || this.context,
      stack: trace,
    });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context: context || this.context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context: context || this.context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context: context || this.context });
  }
}
