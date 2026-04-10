import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StudySessionMode } from '../enums';
import { User } from './user.entity';
import { StudySet } from './study-set.entity';

@Entity('study_session')
export class StudySession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  studySetId: string;

  @Column({ type: 'int', default: 0 })
  cardsStudied: number;

  @Column({ type: 'int', default: 0 })
  correctAnswers: number;

  @Column({ type: 'int', default: 0 })
  incorrectAnswers: number;

  @Column({ type: 'int', default: 0 })
  durationSeconds: number;

  @Column({ type: 'varchar', length: 16 })
  mode: StudySessionMode;

  @Column({ type: 'timestamptz' })
  startedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @ManyToOne(() => User, (u) => u.studySessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => StudySet, (s) => s.studySessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studySetId' })
  studySet: StudySet;
}
