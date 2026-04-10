import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { CollaboratorRole } from '../enums';
import { User } from './user.entity';
import { StudySet } from './study-set.entity';

@Entity('study_set_collaborator')
@Unique(['userId', 'studySetId'])
export class StudySetCollaborator {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  studySetId: string;

  @Column({ type: 'varchar', length: 16, default: CollaboratorRole.VIEWER })
  role: CollaboratorRole;

  @ManyToOne(() => User, (u) => u.collaborations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => StudySet, (s) => s.collaborators, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studySetId' })
  studySet: StudySet;
}
