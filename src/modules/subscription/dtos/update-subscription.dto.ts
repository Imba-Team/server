import {
  IsString,
  IsNumber,
  IsEnum,
  Min,
  IsOptional,
  IsBoolean,
  IsDate,
} from 'class-validator';
import {
  SubscriptionMethod,
  SubscriptionStatus,
} from 'src/common/interfaces/subscription.interface';

export class UpdateSubscriptionDto {
  @IsNumber()
  @Min(0)
  amount: number;

  @IsEnum(SubscriptionStatus)
  status: SubscriptionStatus;

  @IsEnum(SubscriptionMethod)
  subscriptionMethod: SubscriptionMethod;

  @IsString()
  @IsOptional()
  transactionId?: string;

  @IsBoolean()
  @IsOptional()
  isSubscription?: boolean;

  @IsDate()
  @IsOptional()
  subscriptionStart?: Date;

  @IsDate()
  @IsOptional()
  subscriptionEnd?: Date;

  @IsString()
  @IsOptional()
  subscriptionPlanId?: string;
}

export class UpdateSubscriptionStatusDto {
  @IsEnum(SubscriptionStatus)
  status: SubscriptionStatus;
}
