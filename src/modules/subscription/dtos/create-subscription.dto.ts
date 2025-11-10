import { IsEnum, IsOptional, IsDate } from 'class-validator';
import {
  SubscriptionMethod,
  SubscriptionStatus,
} from 'src/common/interfaces/subscription.interface';

export class CreateSubscriptionDto {
  @IsEnum(SubscriptionStatus)
  status: SubscriptionStatus;

  @IsEnum(SubscriptionMethod)
  subscriptionMethod: SubscriptionMethod;

  @IsDate()
  @IsOptional()
  subscriptionStart?: Date;

  @IsDate()
  @IsOptional()
  subscriptionEnd?: Date;
}
