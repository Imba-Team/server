import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Module } from 'src/modules/module/module.entity';
import { Term } from 'src/modules/terms/term.entity';
import { User } from 'src/modules/users/user.entity';

export const typeOrmConfigAsync = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService): TypeOrmModuleOptions => ({
    type: 'postgres',
    url: configService.get<string>('DATABASE_URL'),
    entities: [Module, Term, User],
    synchronize: true, // NOTE: Need to disable in production and use migrations
    autoLoadEntities: true,
  }),
};
