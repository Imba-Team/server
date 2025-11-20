import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Module } from '../modules/module/module.entity';
import { Term } from '../modules/terms/term.entity';
import { User } from '../modules/users/user.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [Module, Term, User],
  migrations: ['dist/migrations/*.js'],
  synchronize: false, // Important: CLI datasource NEVER uses synchronize
});
