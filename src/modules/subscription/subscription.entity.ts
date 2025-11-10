import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { User } from '../users/user.entity';
import {
  SubscriptionMethod,
  SubscriptionStatus,
} from 'src/common/interfaces/subscription.interface';

@Entity('subscription')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: SubscriptionStatus })
  status: SubscriptionStatus;

  @Column({ type: 'enum', enum: SubscriptionMethod })
  subscriptionMethod: SubscriptionMethod;

  @Column({ nullable: true, type: 'timestamp' })
  subscriptionStart?: Date;

  @Column({ nullable: true, type: 'timestamp' })
  subscriptionEnd?: Date;

  @OneToOne(() => User, (user) => user.subscription)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
