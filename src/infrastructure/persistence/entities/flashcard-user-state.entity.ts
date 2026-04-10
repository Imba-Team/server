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
import { User } from './user.entity';
import { Flashcard } from './flashcard.entity';

@Entity('flashcard_user_state')
@Unique(['userId', 'flashcardId'])
export class FlashcardUserState {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  flashcardId: string;

  @Column({ type: 'timestamptz', nullable: true })
  nextReviewAt: Date | null;

  @Column({ type: 'int', default: 1 })
  intervalDays: number;

  @Column({ type: 'double precision', default: 2.5 })
  easeFactor: number;

  @Column({ default: false })
  isStarred: boolean;

  @Column({ type: 'int', default: 0 })
  correctCount: number;

  @Column({ type: 'int', default: 0 })
  incorrectCount: number;

  @Column({ type: 'double precision', default: 0 })
  confidenceLevel: number;

  @Column({ type: 'timestamptz', nullable: true })
  lastReviewedAt: Date | null;

  @ManyToOne(() => User, (u) => u.flashcardUserStates, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Flashcard, (f) => f.userStates, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'flashcardId' })
  flashcard: Flashcard;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
