import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Module } from 'src/modules/v1/module/module.entity';
import { Term } from 'src/modules/v1/terms/term.entity';
import { User } from 'src/modules/users/user.entity';
import { UserModule } from 'src/modules/v2/module/user-module.entity';
import { UserTermProgress } from 'src/modules/v2/term/user-term-progress.entity';

export const typeOrmConfigAsync = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService): TypeOrmModuleOptions => ({
    type: 'postgres',
    url: configService.get<string>('DATABASE_URL'),
    entities: [Module, Term, User, UserModule, UserTermProgress],
    synchronize: true, // NOTE: Need to disable in production and use migrations
    autoLoadEntities: true,
  }),
};
