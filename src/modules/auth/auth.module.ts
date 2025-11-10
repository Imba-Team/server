// auth.module.ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { UsersService } from '../users/user.service';
import { User } from '../users/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MagicLinkService } from './magic-link.service';
import { MagicLink } from './magic-link.entity';
import { MailService } from 'src/common/mail/mail.service';
import { MailModule } from 'src/common/mail/mail.module';
// import { MailerService } from '@nestjs-modules/mailer';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    TypeOrmModule.forFeature([MagicLink]),
    PassportModule,
    MailModule,
    JwtModule.register({
      secret: 'JWT_SECRET_KEY', // Use .env in production
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UsersService,
    MagicLinkService,
    MailService,
    MailModule,
  ],
  exports: [
    AuthService,
    MailModule,
    UsersService,
    MagicLinkService,
    // MailService,
    // MailerService,
    TypeOrmModule.forFeature([User]),
    TypeOrmModule.forFeature([MagicLink]),
  ],
})
export class AuthModule {}
