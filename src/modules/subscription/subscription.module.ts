import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from './subscription.entity';
import { AuthModule } from '../auth/auth.module';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { AdminSubscriptionController } from './admin-subscription.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription]),
    AuthModule,
    TypeOrmModule.forFeature([Subscription]),
  ],
  controllers: [SubscriptionController, AdminSubscriptionController],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
