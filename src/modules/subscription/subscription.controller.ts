import {
  Controller,
  Body,
  UseFilters,
  UseGuards,
  Get,
  Patch,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { Subscription } from './subscription.entity';
import { HttpExceptionFilter } from 'src/common/filters/http-exception.filter';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtGuard } from 'src/guards/jwt.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { IUser } from 'src/common/interfaces/user.interface';
import { ResponseDto } from 'src/common/interfaces/response.dto';
import { SubscriptionResponseDto } from './dtos/subscription-response.dto';
import { UpdateSubscriptionStatusDto } from './dtos/update-subscription.dto';
import { RolesGuard } from 'src/guards/roles.guard';
import { Role, Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('Subscriptions')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.USER, Role.ADMIN)
@Controller('user/subscription')
@UseFilters(HttpExceptionFilter)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('')
  @ApiOperation({ summary: 'Get my subscription history' })
  @ApiResponse({
    status: 200,
    description: 'List of my subscriptions',
    type: [Subscription],
  })
  async getMySubscription(
    @CurrentUser() user: IUser,
  ): Promise<ResponseDto<SubscriptionResponseDto>> {
    const subscriptions = await this.subscriptionService.getByUserId(user.id);
    return {
      ok: true,
      message: 'Subscriptions retrieved successfully',
      data: subscriptions,
    };
  }

  @Patch('status')
  @ApiOperation({ summary: 'Update my subscription status' })
  @ApiResponse({
    status: 200,
    description: 'Subscription status updated successfully',
    type: Subscription,
  })
  async updateStatus(
    @CurrentUser() user: IUser,
    @Body() updateStatusDto: UpdateSubscriptionStatusDto,
  ): Promise<ResponseDto<SubscriptionResponseDto>> {
    const subscription =
      await this.subscriptionService.updateSubscriptionStatus(
        user.id,
        updateStatusDto.status,
      );
    return {
      ok: true,
      message: 'Subscription status updated successfully',
      data: subscription,
    };
  }
}
