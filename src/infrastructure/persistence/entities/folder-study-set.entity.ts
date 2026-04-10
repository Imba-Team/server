import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Folder } from './folder.entity';
import { StudySet } from './study-set.entity';

@Entity('folder_study_set')
@Unique(['folderId', 'studySetId'])
export class FolderStudySet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  folderId: string;

  @Column({ type: 'uuid' })
  studySetId: string;

  @ManyToOne(() => Folder, (f) => f.folderStudySets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'folderId' })
  folder: Folder;

  @ManyToOne(() => StudySet, (s) => s.folderStudySets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studySetId' })
  studySet: StudySet;
}
