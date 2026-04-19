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
import { StudySetVisibility } from '../enums';
import { User } from './user.entity';
import { Flashcard } from './flashcard.entity';
import { Comment } from './comment.entity';
import { StudySession } from './study-session.entity';
import { FavoriteStudySet } from './favorite-study-set.entity';
import { StudySetCollaborator } from './study-set-collaborator.entity';
import { FolderStudySet } from './folder-study-set.entity';
import { StudySetTag } from './study-set-tag.entity';
import { TestAttempt } from './test-attempt.entity';

@Entity('study_set')
export class StudySet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ unique: true })
  slug: string;

  @ApiProperty()
  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'varchar',
    length: 16,
    default: StudySetVisibility.PUBLIC,
  })
  visibility: StudySetVisibility;

  @Column({ type: 'varchar', nullable: true })
  language: string | null;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (u) => u.studySets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => Flashcard, (f) => f.studySet, { cascade: false })
  flashcards: Flashcard[];

  @OneToMany(() => Comment, (c) => c.studySet)
  comments: Comment[];

  @OneToMany(() => StudySession, (s) => s.studySet)
  studySessions: StudySession[];

  @OneToMany(() => FavoriteStudySet, (f) => f.studySet)
  favorites: FavoriteStudySet[];

  @OneToMany(() => StudySetCollaborator, (c) => c.studySet)
  collaborators: StudySetCollaborator[];

  @OneToMany(() => FolderStudySet, (fs) => fs.studySet)
  folderStudySets: FolderStudySet[];

  @OneToMany(() => StudySetTag, (t) => t.studySet)
  tags: StudySetTag[];

  @OneToMany(() => TestAttempt, (t) => t.studySet)
  testAttempts: TestAttempt[];

  @ApiProperty({ example: 0 })
  flashcardsCount: number;

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
