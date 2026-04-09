import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Module } from './module.entity';
import { UserTermProgress } from './user-term-progress.entity';

@Entity('term')
export class Term {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Example of term' })
  @Column()
  term: string;

  @ApiProperty({ example: 'Example definition of the term' })
  @Column()
  definition: string;

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    description: 'The ID of the module that owns this term',
  })
  @Column({ type: 'uuid' })
  moduleId: string;

  @ManyToOne(() => Module, (module) => module.terms, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'moduleId' })
  module: Module;

  @OneToMany(
    () => UserTermProgress,
    (progress: UserTermProgress) => progress.term,
    { cascade: false },
  )
  userProgress: UserTermProgress[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
