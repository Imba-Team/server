import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { StudySet } from './study-set.entity';
import { Tag } from './tag.entity';

@Entity('study_set_tag')
@Unique(['studySetId', 'tagId'])
export class StudySetTag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  studySetId: string;

  @Column({ type: 'uuid' })
  tagId: string;

  @ManyToOne(() => StudySet, (s) => s.tags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studySetId' })
  studySet: StudySet;

  @ManyToOne(() => Tag, (t) => t.studySetTags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tagId' })
  tag: Tag;
}
