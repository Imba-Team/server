import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  SubscriptionMethod,
  SubscriptionStatus,
} from 'src/common/interfaces/subscription.interface';

export class SubscriptionResponseDto {
  @Expose()
  @ApiProperty({ description: 'Unique identifier of the subscription' })
  id: string;

  @Expose()
  @ApiProperty({
    description: 'Status of the subscription',
    enum: SubscriptionStatus,
  })
  status: SubscriptionStatus;

  @Expose()
  @ApiProperty({
    description: 'Method used for the subscription',
    enum: SubscriptionMethod,
  })
  subscriptionMethod: SubscriptionMethod;

  @Expose()
  @ApiProperty({
    description: 'ID of the user associated with the subscription',
  })
  userId: string;

  @Expose()
  @ApiProperty({
    description: 'Start date of the subscription, if applicable',
    required: false,
    type: Date,
  })
  subscriptionStart?: Date;

  @Expose()
  @ApiProperty({
    description: 'End date of the subscription, if applicable',
    required: false,
    type: Date,
  })
  subscriptionEnd?: Date;

  @Expose()
  @ApiProperty({
    description: 'Date when the subscription was created',
    type: Date,
  })
  createdAt: Date;

  @Expose()
  @ApiProperty({
    description: 'Date when the subscription was last updated',
    type: Date,
  })
  updatedAt: Date;
}
