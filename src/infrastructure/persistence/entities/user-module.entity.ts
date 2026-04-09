import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Module } from './module.entity';

/** creator vs added-from-public; one row per (user, module) */
export type UserModuleRelation = 'owner' | 'collected';

@Entity('user_module')
@Unique(['userId', 'moduleId'])
export class UserModule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  moduleId: string;

  @Column({ type: 'varchar', length: 20, default: 'collected' })
  relation: UserModuleRelation;

  @ManyToOne(() => User, (user) => user.userModules, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Module, (module) => module.userModules, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'moduleId' })
  module: Module;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
