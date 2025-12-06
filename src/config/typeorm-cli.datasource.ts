import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Module } from '../modules/module/module.entity';
import { Term } from '../modules/terms/term.entity';
import { User } from '../modules/users/user.entity';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Module, Term, User],
  migrations: ['dist/migrations/*.js'],
  synchronize: false, // Important: CLI datasource NEVER uses synchronize
});
