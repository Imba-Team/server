import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { StudySet } from './study-set.entity';
import { TestQuestionAttempt } from './test-question-attempt.entity';

@Entity('test_attempt')
export class TestAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  studySetId: string;

  @Column({ type: 'double precision', default: 0 })
  score: number;

  @Column({ type: 'int' })
  totalQuestions: number;

  @ManyToOne(() => User, (u) => u.testAttempts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => StudySet, (s) => s.testAttempts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studySetId' })
  studySet: StudySet;

  @OneToMany(() => TestQuestionAttempt, (q) => q.testAttempt)
  testQuestionAttempts: TestQuestionAttempt[];

  @CreateDateColumn()
  createdAt: Date;
}
