import {
  Controller,
  Get,
  Patch,
  Body,
  HttpCode,
  UseGuards,
  Delete,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { UsersService } from './user.service';
import { UpdateUserDto } from './dtos/update-user.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { IUser } from 'src/common/interfaces/user.interface';
import { JwtGuard } from 'src/guards/jwt.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { Role, Roles } from 'src/common/decorators/roles.decorator';
import { StatusGuard } from 'src/guards/status.guard';
import { plainToInstance } from 'class-transformer';
import { UserResponseDto } from './dtos/user-response.dto';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { ResponseDto } from 'src/common/interfaces/response.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.USER, Role.ADMIN)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'User profile returned successfully',
    type: UserResponseDto,
  })
  async getMe(
    @CurrentUser() user: IUser,
  ): Promise<ResponseDto<UserResponseDto>> {
    const foundUser = await this.usersService.findByEmail(user.email);
    const data = plainToInstance(UserResponseDto, foundUser, {
      excludeExtraneousValues: true,
    });

    return {
      ok: true,
      message: 'User profile returned successfully',
      data,
    };
  }

  @UseGuards(JwtGuard, StatusGuard)
  @Patch('me')
  @HttpCode(200)
  @ApiOperation({ summary: 'Update current user' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: UserResponseDto,
  })
  async updateMe(
    @CurrentUser() user: IUser,
    @Body() dto: UpdateUserDto,
  ): Promise<ResponseDto<UserResponseDto | null>> {
    const updatedUser = await this.usersService.update(user.id, dto);

    return {
      ok: true,
      message: 'User updated successfully',
      data: updatedUser
        ? plainToInstance(UserResponseDto, updatedUser, {
            excludeExtraneousValues: true,
          })
        : null,
    };
  }

  @Patch('me/change-password')
  @HttpCode(200)
  @UseGuards(JwtGuard, StatusGuard)
  @ApiOperation({ summary: 'Update current user password' })
  @ApiResponse({
    status: 200,
    description: 'Password updated successfully',
    schema: {
      example: {
        ok: true,
        message: 'Password updated successfully',
        data: null,
      },
    },
  })
  async updatePassword(
    @CurrentUser() user: IUser,
    @Body() data: ChangePasswordDto,
  ): Promise<ResponseDto<null>> {
    const result = await this.usersService.changePassword(user.id, data);
    return {
      ok: result.ok,
      message: result.message,
      data: null,
    };
  }

  @Delete('me')
  @HttpCode(200)
  @UseGuards(JwtGuard, StatusGuard)
  @ApiOperation({ summary: 'Delete current user' })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
    type: UserResponseDto,
  })
  async deleteMe(
    @CurrentUser() user: IUser,
  ): Promise<ResponseDto<UserResponseDto | null>> {
    const deletedUser = await this.usersService.delete(user.id);
    return {
      ok: true,
      message: 'User deleted successfully',
      data: deletedUser
        ? plainToInstance(UserResponseDto, deletedUser, {
            excludeExtraneousValues: true,
          })
        : null,
    };
  }
}
