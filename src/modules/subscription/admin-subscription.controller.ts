import {
  Controller,
  UseFilters,
  UseGuards,
  Get,
  Query,
  Patch,
  Body,
  Delete,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { Subscription } from './subscription.entity';
import {
  SubscriptionMethod,
  SubscriptionStatus,
} from 'src/common/interfaces/subscription.interface';
import { HttpExceptionFilter } from 'src/common/filters/http-exception.filter';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtGuard } from 'src/guards/jwt.guard';
import { ResponseDto } from 'src/common/interfaces/response.dto';
import { SubscriptionResponseDto } from './dtos/subscription-response.dto';
import { UpdateSubscriptionDto } from './dtos/update-subscription.dto';
import { RolesGuard } from 'src/guards/roles.guard';
import { Role, Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('Admin - Subscriptions')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.USER, Role.ADMIN)
@Controller('admin/subscriptions')
@UseFilters(HttpExceptionFilter)
export class AdminSubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get()
  @ApiOperation({ summary: 'Get subscriptions with optional filters' })
  @ApiQuery({ name: 'status', required: false, enum: SubscriptionStatus })
  @ApiQuery({
    name: 'subscriptionMethod',
    required: false,
    enum: SubscriptionMethod,
  })
  @ApiQuery({ name: 'page', required: false, type: Number, default: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, default: 10 })
  @ApiResponse({
    status: 200,
    description: 'List of subscriptions with optional filters',
    type: [SubscriptionResponseDto],
  })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: SubscriptionStatus,
    @Query('subscriptionMethod') subscriptionMethod?: SubscriptionMethod,
  ): Promise<ResponseDto<SubscriptionResponseDto[]>> {
    const {
      data,
      total,
      page: currentPage,
      limit: currentLimit,
      totalPages,
    } = await this.subscriptionService.findAll(+page, +limit, {
      status,
      subscriptionMethod,
    });

    return {
      ok: true,
      message: 'Subscriptions fetched successfully',
      data,
      meta: {
        total,
        page: currentPage,
        limit: currentLimit,
        totalPages,
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subscription by ID' })
  @ApiResponse({
    status: 200,
    description: 'Subscription found',
    type: SubscriptionResponseDto,
  })
  async findOne(@Query('id') id: string): Promise<ResponseDto<Subscription>> {
    const subscription = await this.subscriptionService.getById(id);
    return {
      ok: true,
      message: 'Subscription fetched successfully',
      data: subscription,
    };
  }

  @Patch(':id/')
  @ApiOperation({ summary: 'Update subscription info by ID' })
  @ApiResponse({
    status: 200,
    description: 'Subscription updated successfully',
    type: SubscriptionResponseDto,
  })
  async updateSubscription(
    @Query('id') id: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
  ): Promise<ResponseDto<SubscriptionResponseDto>> {
    const updatedSubscription =
      await this.subscriptionService.updateSubscription(
        id,
        updateSubscriptionDto,
      );
    return {
      ok: true,
      message: 'Subscription updated successfully',
      data: updatedSubscription,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete subscription by ID' })
  @ApiResponse({
    status: 200,
    description: 'Subscription deleted successfully',
  })
  async deleteSubscription(
    @Query('id') id: string,
  ): Promise<ResponseDto<void>> {
    await this.subscriptionService.deleteById(id);
    return {
      ok: true,
      message: 'Subscription deleted successfully',
    };
  }
}
