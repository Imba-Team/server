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

@Entity('book')
export class Book {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: "The Hitchhiker's Guide to the Galaxy" })
  @Column({ unique: true })
  title: string;

  @ApiProperty({ example: 'Douglas Adams' })
  @Column()
  author: string;

  @ApiProperty({ example: '978-0345391803', required: false })
  @Column({ unique: true, nullable: true })
  isbn: string;

  @ApiProperty({ example: 'Science Fiction', required: false })
  @Column({ nullable: true })
  genre: string;

  @ApiProperty({ example: 300, required: false })
  @Column({ type: 'int', nullable: true })
  pages: number;

  @ApiProperty({ example: '1979-10-12', required: false })
  @Column({ type: 'date', nullable: true })
  publishedDate: Date;

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    description: 'The ID of the user who owns this book',
  })
  @Column({ type: 'uuid' }) // This column will store the userId
  userId: string;

  @ManyToOne(() => User, (user) => user.books, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
