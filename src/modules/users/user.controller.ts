import {
  Controller,
  Get,
  Patch,
  Body,
  HttpCode,
  UseGuards,
  Delete,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
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
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { ApiConsumes } from '@nestjs/swagger';
import type { Request } from 'express';
import type { MulterOptions } from 'multer';

type MulterFile = { originalname: string; filename?: string };

const multerOptions: MulterOptions = {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  storage: diskStorage({
    destination: (
      req: Request & { user?: { id?: string } },
      file: MulterFile,
      cb: (err: Error | null, destination: string) => void,
    ) => {
      const uploadPath = join(process.cwd(), 'uploads', 'profile-pictures');
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (
      req: Request & { user?: { id?: string } },
      file: MulterFile,
      cb: (err: Error | null, filename: string) => void,
    ) => {
      const userId = req.user?.id ?? Date.now().toString();
      const fileExt = extname(file.originalname || '');
      const filename = `${userId}-${Date.now()}${fileExt}`;
      cb(null, filename);
    },
  }),

  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: (
    req: Request,
    file: MulterFile,
    cb: (err: Error | null, acceptFile: boolean) => void,
  ) => {
    const allowed = /\.jpeg$|\.jpg$|\.png$|\.gif$/i;
    const ext = extname(file.originalname || '').toLowerCase();
    if (allowed.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
};

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

  @Patch('me/profile-picture')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('file', multerOptions as any))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @ApiOperation({ summary: "Upload / update user's profile picture" })
  async uploadProfilePicture(
    @CurrentUser() user: IUser,
    @UploadedFile() file: MulterFile,
  ): Promise<ResponseDto<UserResponseDto | null>> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const relativePath = `/uploads/profile-pictures/${file.filename}`;
    const updatedUser = await this.usersService.update(user.id, {
      profilePicture: relativePath,
    } as unknown as UpdateUserDto);

    return {
      ok: true,
      message: 'Profile picture updated successfully',
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
