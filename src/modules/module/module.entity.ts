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
import { User } from '../users/user.entity';

@Entity('module')
export class Module {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: "The Hitchhiker's Guide to the Galaxy" })
  @Column({ unique: true })
  title: string;

  @ApiProperty({ example: 'Example of the description' })
  @Column()
  description: string;

  @ApiProperty({ example: 'Science Fiction', required: false })
  @Column({ nullable: true })
  genre: string;

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
