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
import { User } from './user.entity';
import { StudySet } from './study-set.entity';

@Entity('comment')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  studySetId: string;

  @Column({ type: 'uuid', nullable: true })
  parentCommentId: string | null;

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ type: 'text' })
  content: string;

  @ManyToOne(() => User, (u) => u.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => StudySet, (s) => s.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studySetId' })
  studySet: StudySet;

  @ManyToOne(() => Comment, (c) => c.replies, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'parentCommentId' })
  parentComment: Comment | null;

  @OneToMany(() => Comment, (c) => c.parentComment)
  replies: Comment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
