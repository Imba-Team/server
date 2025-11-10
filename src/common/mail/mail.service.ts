import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  async sendMail(options: { to: string; subject: string; html: string }) {
    try {
      const fromEmail = this.configService.get<string>('NO_REPLY_MAIL');
      if (!fromEmail) {
        this.logger.error(
          'NO_REPLY_MAIL is not defined in environment variables.',
        );

        return false;
      }

      await this.mailerService.sendMail({
        to: options.to,
        from: fromEmail,
        subject: options.subject,
        html: options.html,
      });
      return true;
    } catch (error) {
      // TODO: Need to consider using different error handling strategies
      if (error instanceof Error) {
        this.logger.error(
          `Mail send error in MailService: ${error.message}\n${error.stack ?? ''}`,
        );
      } else {
        this.logger.error(
          `Mail send error in MailService: Unknown error type: ${JSON.stringify(error)}`,
        );
      }
      return false;
    }
  }
}
