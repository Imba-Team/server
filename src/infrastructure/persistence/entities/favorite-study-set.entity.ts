import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { StudySet } from './study-set.entity';

@Entity('favorite_study_set')
@Unique(['userId', 'studySetId'])
export class FavoriteStudySet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  studySetId: string;

  @ManyToOne(() => User, (u) => u.favoriteStudySets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => StudySet, (s) => s.favorites, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studySetId' })
  studySet: StudySet;

  @CreateDateColumn()
  createdAt: Date;
}
