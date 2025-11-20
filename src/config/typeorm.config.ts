import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Module } from 'src/modules/module/module.entity';
import { Term } from 'src/modules/terms/term.entity';
import { User } from 'src/modules/users/user.entity';

export const typeOrmConfigAsync = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
    const databaseUrl = configService.get<string>('DATABASE_URL');

    if (databaseUrl) {
      return {
        type: 'postgres',
        url: databaseUrl,
        entities: [Module, Term, User],
        synchronize: true, // NOTE: disable in production and use migrations
        autoLoadEntities: true,
        // optional: enable SSL for platforms like Heroku if needed
        ssl: configService.get('DATABASE_SSL') ? { rejectUnauthorized: false } : undefined,
      };
    }

    return {
      type: 'postgres',
      host: configService.get('DATABASE_HOST'),
      port: configService.get<number>('DATABASE_PORT'),
      username: configService.get('DATABASE_USER'),
      password: configService.get('DATABASE_PASSWORD'),
      database: configService.get('DATABASE_NAME'),
      entities: [Module, Term, User],
      synchronize: true, // NOTE: disable in production and use migrations
      autoLoadEntities: true,
    };
  },
};
