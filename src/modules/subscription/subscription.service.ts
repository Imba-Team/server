import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from './subscription.entity';
import { User } from '../users/user.entity';
import { CreateSubscriptionDto } from './dtos/create-subscription.dto';
import {
  SubscriptionMethod,
  SubscriptionStatus,
} from 'src/common/interfaces/subscription.interface';
import { LoggerService } from 'src/common/logger/logger.service';
import { UpdateSubscriptionDto } from './dtos/update-subscription.dto';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    private readonly logger: LoggerService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async getByUserId(id: string) {
    this.logger.log(`Fetching subscription with User ID: ${id}`);
    const subscription = await this.subscriptionRepository.findOneBy({
      userId: id,
    });
    if (!subscription) throw new Error('Subscription not found');
    return subscription;
  }

  async updateSubscriptionStatus(userId: string, status: SubscriptionStatus) {
    this.logger.log(
      `Updating subscription status for User ID: ${userId} to ${status}`,
    );

    const subscription = await this.getByUserId(userId);
    if (!subscription) throw new NotFoundException('Subscription not found');
    subscription.status = status;
    const updatedSubscription =
      await this.subscriptionRepository.save(subscription);
    this.logger.log(
      `Subscription status updated to ${status} for User ID: ${userId}`,
    );
    return updatedSubscription;
  }

  // NOTE: This method should not be used
  async createSubscription(userId: string, dto: CreateSubscriptionDto) {
    this.logger.log(`Creating subscription for User ID: ${userId}`);
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('User not found');

    const subscription = this.subscriptionRepository.create({
      ...dto,
      userId: user.id,
      status: SubscriptionStatus.PENDING, // Default status
    });

    const savedSubscription =
      await this.subscriptionRepository.save(subscription);
    this.logger.log(`Subscription created with ID: ${savedSubscription.id}`);
    return savedSubscription;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    filter?: {
      status?: SubscriptionStatus;
      subscriptionMethod?: SubscriptionMethod;
    },
  ) {
    this.logger.log('Fetching subscriptions with filters');
    const query =
      this.subscriptionRepository.createQueryBuilder('subscription');
    if (filter?.status) {
      query.andWhere('subscription.status = :status', {
        status: filter.status,
      });
    }
    if (filter?.subscriptionMethod) {
      query.andWhere('subscription.subscriptionMethod = :subscriptionMethod', {
        subscriptionMethod: filter.subscriptionMethod,
      });
    }
    query.skip((page - 1) * limit).take(limit);
    const [subscriptions, total] = await query.getManyAndCount();
    this.logger.log(`Found ${total} subscriptions`);
    return {
      data: subscriptions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getById(id: string): Promise<Subscription> {
    this.logger.log(`Fetching subscription with ID: ${id}`);
    const subscription = await this.subscriptionRepository.findOneBy({ id });
    if (!subscription) throw new Error('Subscription not found');
    return subscription;
  }

  async updateSubscription(id: string, updateData: UpdateSubscriptionDto) {
    this.logger.log(`Updating subscription with ID: ${id}`);
    const subscription = await this.getById(id);
    if (!subscription) throw new NotFoundException('Subscription not found');
    Object.assign(subscription, updateData);
    return this.subscriptionRepository.save(subscription);
  }

  async deleteById(id: string): Promise<void> {
    this.logger.log(`Deleting subscription with ID: ${id}`);
    const subscription = await this.getById(id);
    if (!subscription) throw new Error('Subscription not found');

    await this.subscriptionRepository.remove(subscription);
  }
}
