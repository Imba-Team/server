import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Module } from './entities/module.entity';
import { Term } from './entities/term.entity';
import { User } from './entities/user.entity';
import { UserModule } from './entities/user-module.entity';
import { UserTermProgress } from './entities/user-term-progress.entity';
import { MagicLink } from './entities/magic-link.entity';

export const typeOrmConfigAsync = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService): TypeOrmModuleOptions => ({
    type: 'postgres',
    url: configService.get<string>('DATABASE_URL'),
    entities: [Module, Term, User, UserModule, UserTermProgress, MagicLink],
    synchronize: true, // NOTE: Need to disable in production and use migrations
    autoLoadEntities: true,
  }),
};
