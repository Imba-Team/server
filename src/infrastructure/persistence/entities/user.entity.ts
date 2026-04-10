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
import { StudySet } from './study-set.entity';
import { Comment } from './comment.entity';
import { StudySession } from './study-session.entity';
import { StudySetCollaborator } from './study-set-collaborator.entity';
import { FavoriteStudySet } from './favorite-study-set.entity';
import { Folder } from './folder.entity';
import { TestAttempt } from './test-attempt.entity';
import { FlashcardUserState } from './flashcard-user-state.entity';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'john@example.com' })
  @Column({ unique: true })
  email: string;

  /**
   * Nullable only at DB level so existing rows can be migrated from legacy `name`.
   * Application code always sets this on create; `UsersService` backfills on read.
   */
  @ApiProperty({ example: 'johndoe' })
  @Column({ type: 'varchar', unique: true, nullable: true })
  username: string | null;

  /** Pre–study-set-schema display name; DB column remains `name` where it exists */
  @Column({ type: 'varchar', nullable: true, name: 'name' })
  legacyName: string | null;

  @Column({ type: 'varchar', nullable: true })
  status: string | null;

  @Exclude()
  @Column({ select: false })
  password: string;

  @Column({ default: 'user' })
  role: Role;

  @OneToMany(() => StudySet, (s) => s.user)
  studySets: StudySet[];

  @OneToMany(() => Comment, (c) => c.user)
  comments: Comment[];

  @OneToMany(() => StudySession, (s) => s.user)
  studySessions: StudySession[];

  @OneToMany(() => FavoriteStudySet, (f) => f.user)
  favoriteStudySets: FavoriteStudySet[];

  @OneToMany(() => StudySetCollaborator, (c) => c.user)
  collaborations: StudySetCollaborator[];

  @OneToMany(() => Folder, (f) => f.user)
  folders: Folder[];

  @OneToMany(() => TestAttempt, (t) => t.user)
  testAttempts: TestAttempt[];

  @OneToMany(() => FlashcardUserState, (fs) => fs.user)
  flashcardUserStates: FlashcardUserState[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'text', nullable: true })
  profilePicture?: string | null;

  /** API compatibility: prefers username, then legacy `name` */
  get name(): string {
    const u = (this.username ?? '').trim();
    if (u) return u;
    return (this.legacyName ?? '').trim() || 'user';
  }
}
