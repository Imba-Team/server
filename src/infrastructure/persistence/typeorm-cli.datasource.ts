import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Module } from './entities/module.entity';
import { Term } from './entities/term.entity';
import { User } from './entities/user.entity';
import { UserModule } from './entities/user-module.entity';
import { UserTermProgress } from './entities/user-term-progress.entity';
import { MagicLink } from './entities/magic-link.entity';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Module, Term, User, UserModule, UserTermProgress, MagicLink],
  migrations: ['dist/migrations/*.js'],
  synchronize: false, // Important: CLI datasource NEVER uses synchronize
});
