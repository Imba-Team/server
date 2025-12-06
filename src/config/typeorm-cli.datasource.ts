import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Module } from '../modules/v1/module/module.entity';
import { Term } from '../modules/v1/terms/term.entity';
import { User } from '../modules/users/user.entity';
import { UserModule } from '../modules/v2/module/user-module.entity';
import { UserTermProgress } from '../modules/v2/term/user-term-progress.entity';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Module, Term, User, UserModule, UserTermProgress],
  migrations: ['dist/migrations/*.js'],
  synchronize: false, // Important: CLI datasource NEVER uses synchronize
});
