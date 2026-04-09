import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Term } from './term.entity';
import { UserModule } from './user-module.entity';

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

  @OneToMany(() => Term, (term) => term.module, { onDelete: 'CASCADE' })
  terms: Term[];

  @OneToMany(() => UserModule, (userModule: UserModule) => userModule.module, {
    cascade: false,
  })
  userModules: UserModule[];

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
