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
import { UserModule } from './user-module.entity';
import { UserTermProgress } from './user-term-progress.entity';

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

  @OneToMany(() => UserModule, (userModule: UserModule) => userModule.user, {
    cascade: false,
  })
  userModules: UserModule[];

  @OneToMany(
    () => UserTermProgress,
    (progress: UserTermProgress) => progress.user,
    { cascade: false },
  )
  termProgress: UserTermProgress[];

  @Column({ default: 'user' })
  role: Role;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'text', nullable: true })
  profilePicture?: string | null;
}
