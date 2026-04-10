import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { PERSISTENCE_ENTITIES } from './entity-registry';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [...PERSISTENCE_ENTITIES],
  migrations: ['dist/migrations/*.js'],
  synchronize: false, // Important: CLI datasource NEVER uses synchronize
});
