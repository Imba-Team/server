// This file is used to configure the data source for the application.
// It is not needed unless you need to use such CLI commands as schema:sync or schema:drop.
// Reference: https://docs.nestjs.com/techniques/database#custom-datasource-factory

import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from 'src/modules/module/module.entity';
import { Term } from 'src/modules/terms/term.entity';
import { User } from 'src/modules/users/user.entity';
import { DataSource, DataSourceOptions } from 'typeorm';

TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService): DataSourceOptions => {
    const databaseUrl = configService.get<string>('DATABASE_URL');

    const baseOptions: Partial<DataSourceOptions> = {
      type: 'mysql',
      entities: [Module, Term, User],
      synchronize: true,
    };

    if (databaseUrl) {
      // Use DATABASE_URL when provided (e.g. mysql://user:pass@host:port/dbname)
      return {
        ...baseOptions,
        url: databaseUrl,
      } as DataSourceOptions;
    }

    // Fallback to individual env vars
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
