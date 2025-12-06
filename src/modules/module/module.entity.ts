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
import { User } from '../users/user.entity';
import { Term } from '../terms/term.entity';

@Entity('module')
export class Module {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'module-1' })
  @Column({ unique: true })
  slug: string;

  @ApiProperty({ example: "The Hitchhiker's Guide to the Galaxy" })
  @Column({ unique: true })
  title: string;

  @ApiProperty({ example: 'Example of the description' })
  @Column()
  description: string;

  @ApiProperty({ example: true })
  @Column({ default: true })
  isPrivate: boolean;

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    description: 'The ID of the user who owns this module',
  })
  @Column({ type: 'uuid' }) // This column will store the userId
  userId: string;

  @ManyToOne(() => User, (user) => user.modules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => Term, (term) => term.module, { onDelete: 'CASCADE' })
  terms: Term[];

  @ApiProperty({ example: 0 })
  termsCount: number;

  @ApiProperty({
    example: { not_started: 0.3, in_progress: 0.4, completed: 0.3 },
  })
  progress: {
    not_started: number;
    in_progress: number;
    completed: number;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
