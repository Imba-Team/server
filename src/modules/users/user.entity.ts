import { ApiProperty } from '@nestjs/swagger';
import { Role } from 'src/common/decorators/roles.decorator';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Book } from '../books/book.entity';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'john@example.com' })
  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({ default: 'active' })
  status: 'active' | 'inactive' = 'active';

  @Exclude()
  @Column({ select: false })
  password: string;

  // Add the books relationship here
  @OneToMany(() => Book, (book) => book.user)
  books: Book[];

  @Column({ default: 'user' })
  role: Role;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
