import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PERSISTENCE_ENTITIES } from './entity-registry';

export const typeOrmConfigAsync = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService): TypeOrmModuleOptions => ({
    type: 'postgres',
    url: configService.get<string>('DATABASE_URL'),
    entities: [...PERSISTENCE_ENTITIES],
    synchronize: true, // NOTE: Need to disable in production and use migrations
    autoLoadEntities: true,
  }),
};
