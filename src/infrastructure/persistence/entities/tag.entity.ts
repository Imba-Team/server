import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { StudySetTag } from './study-set-tag.entity';

@Entity('tag')
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @OneToMany(() => StudySetTag, (st) => st.tag)
  studySetTags: StudySetTag[];
}
