import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { StudySet } from './study-set.entity';
import { FlashcardUserState } from './flashcard-user-state.entity';
import { TestQuestionAttempt } from './test-question-attempt.entity';

@Entity('flashcard')
export class Flashcard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  term: string;

  @ApiProperty()
  @Column()
  definition: string;

  @Column({ type: 'int', default: 0 })
  orderIndex: number;

  @Column({ type: 'varchar', nullable: true })
  imageUrl: string | null;

  @Column({ type: 'text', nullable: true })
  hint: string | null;

  @Column({ type: 'varchar', nullable: true })
  status: string | null;

  @Column({ type: 'uuid' })
  studySetId: string;

  @ManyToOne(() => StudySet, (s) => s.flashcards, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studySetId' })
  studySet: StudySet;

  @OneToMany(() => FlashcardUserState, (fs) => fs.flashcard)
  userStates: FlashcardUserState[];

  @OneToMany(() => TestQuestionAttempt, (q) => q.flashcard)
  testQuestionAttempts: TestQuestionAttempt[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
