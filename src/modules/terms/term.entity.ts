import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Module } from '../module/module.entity';

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

  @ApiProperty({ example: 'not_studied', required: false })
  @Column({ default: 'not_studied' })
  status: string;

  @ApiProperty({ example: true })
  @Column({ default: true })
  isStarred: boolean;

  @ApiProperty({ example: 'Science Fiction', required: false })
  @Column({ nullable: true })
  genre: string;

  @ApiProperty({ example: 300, required: false })
  @Column({ type: 'int', nullable: true })
  pages: number;

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    description: 'The ID of the module that owns this term',
  })
  @Column({ type: 'uuid' }) // This column will store the moduleId
  moduleId: string;

  @ManyToOne(() => Module, (module) => module.terms, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'moduleId' })
  module: Module;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
