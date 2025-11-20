import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth2';
import { UsersService } from 'src/modules/users/user.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UsersService,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
      scope: ['profile', 'email'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: {
      id: string;
      name?: { givenName?: string; familyName?: string };
      emails?: { value?: string }[];
      photos?: { value?: string }[];
    },
    done: VerifyCallback,
  ): any {
    const { id, name, emails, photos } = profile;

    const email =
      Array.isArray(emails) && emails[0] && typeof emails[0].value === 'string'
        ? emails[0].value
        : null;
    const picture =
      Array.isArray(photos) && photos[0] && typeof photos[0].value === 'string'
        ? photos[0].value
        : null;
    const givenName = name?.givenName ?? '';
    const familyName = name?.familyName ?? '';

    const user = {
      provider: 'google',
      providerId: id,
      email,
      name: `${givenName} ${familyName}`.trim(),
      picture,
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    done(null, user);
  }
}
