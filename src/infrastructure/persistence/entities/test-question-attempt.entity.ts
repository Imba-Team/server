import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TestAttempt } from './test-attempt.entity';
import { Flashcard } from './flashcard.entity';

@Entity('test_question_attempt')
export class TestQuestionAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  testAttemptId: string;

  @Column({ type: 'uuid' })
  flashcardId: string;

  @Column({ type: 'text', nullable: true })
  userAnswer: string | null;

  @Column({ default: false })
  isCorrect: boolean;

  @ManyToOne(() => TestAttempt, (t) => t.testQuestionAttempts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'testAttemptId' })
  testAttempt: TestAttempt;

  @ManyToOne(() => Flashcard, (f) => f.testQuestionAttempts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'flashcardId' })
  flashcard: Flashcard;
}
