import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Term } from '../../v1/terms/term.entity';

export type TermProgressStatus = 'not_started' | 'in_progress' | 'completed';

@Entity('user_term_progress')
@Unique(['userId', 'termId'])
export class UserTermProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  termId: string;

  @Column({
    type: 'enum',
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started',
  })
  status: TermProgressStatus;

  @Column({ default: false })
  isStarred: boolean;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  @ManyToOne(() => User, (user: User) => user.termProgress, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  @ManyToOne(() => Term, (term: Term) => term.userProgress, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'termId' })
  term: Term;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
