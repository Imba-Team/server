// Optional alternate data source factory (e.g. schema:sync / schema:drop).
// Reference: https://docs.nestjs.com/techniques/database#custom-datasource-factory

import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PERSISTENCE_ENTITIES } from './entity-registry';
import { DataSource, DataSourceOptions } from 'typeorm';

TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService): DataSourceOptions => {
    const databaseUrl = configService.get<string>('DATABASE_URL');

    const baseOptions: Partial<DataSourceOptions> = {
      type: 'mysql',
      entities: [...PERSISTENCE_ENTITIES],
      synchronize: true,
    };

    if (databaseUrl) {
      return {
        ...baseOptions,
        url: databaseUrl,
      } as DataSourceOptions;
    }

    return {
      ...baseOptions,
      host: configService.get('DATABASE_HOST'),
      port: parseInt(configService.get('DATABASE_PORT') || '3306', 10),
      username: configService.get('DATABASE_USER'),
      password: configService.get('DATABASE_PASSWORD'),
      database: configService.get('DATABASE_NAME'),
    } as DataSourceOptions;
  },
  dataSourceFactory: async (options: DataSourceOptions) => {
    if (!options) {
      throw new Error('DataSource options are undefined');
    }
    const dataSource = await new DataSource(options).initialize();
    return dataSource;
  },
});
