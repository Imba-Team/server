import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { JwtGuard } from 'src/guards/jwt.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { Role, Roles } from 'src/common/decorators/roles.decorator';
import { ResponseDto } from 'src/common/interfaces/response.dto';
import { plainToInstance } from 'class-transformer';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { IUser } from 'src/common/interfaces/user.interface';
import { ModuleService } from './module.service';
import { CreateModuleDto } from './dtos/create-module';
import { ModuleResponseDto } from './dtos/module-response.dto';
import { UpdateModuleDto } from './dtos/update-module';

@ApiTags('Modules')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.USER, Role.ADMIN)
@Controller('modules')
export class ModuleController {
  constructor(private readonly moduleService: ModuleService) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a new module' })
  @ApiBody({ type: CreateModuleDto })
  @ApiResponse({
    status: 201,
    description: 'Module created successfully',
    type: ModuleResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict: Module with same details already exists',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found (for the provided userId)',
  })
  async create(
    @CurrentUser() user: IUser,
    @Body() createModuleDto: CreateModuleDto,
  ): Promise<ResponseDto<ModuleResponseDto>> {
    const newModule = await this.moduleService.create(user.id, createModuleDto);
    const data = plainToInstance(ModuleResponseDto, newModule, {
      excludeExtraneousValues: true,
    });

    return {
      ok: true,
      message: 'Module created successfully',
      data,
    };
  }

  @Get()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Get all modules with pagination and optional filters',
  })
  @ApiResponse({
    status: 200,
    description: 'List of modules returned successfully',
    type: [ModuleResponseDto],
  })
  async findAll(@CurrentUser() user: IUser) {
    

    const data = await this.moduleService.findByUserId(user.id);

    return {
      ok: true,
      message: 'Modules retrieved successfully',
      data: data.map(module => plainToInstance(ModuleResponseDto, module, {
        excludeExtraneousValues: true,
      })),
    };
  }

  @Get('all')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get all modules (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'List of all modules returned successfully',
    type: [ModuleResponseDto],
  })
  @Roles(Role.ADMIN)
  async findAllModules(): Promise<ResponseDto<ModuleResponseDto[]>> {
    const modules = await this.moduleService.findAll();
    const data = modules.map(module =>
      plainToInstance(ModuleResponseDto, module, {
        excludeExtraneousValues: true,
      }),
    );

    return {
      ok: true,
      message: 'All modules retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get a module by ID' })
  @ApiResponse({
    status: 200,
    description: 'Module returned successfully',
    type: ModuleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Module not found' })
  async findOne(
    @Param('id') id: string,
  ): Promise<ResponseDto<ModuleResponseDto>> {
    const module = await this.moduleService.findById(id);
    const data = plainToInstance(ModuleResponseDto, module, {
      excludeExtraneousValues: true,
    });

    return {
      ok: true,
      message: 'Module retrieved successfully',
      data,
    };
  }

  @Get('slug/:slug')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get a module by slug' })
  @ApiResponse({
    status: 200,
    description: 'Module returned successfully',
    type: ModuleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Module not found' })
  async findBySlug(
    @Param('slug') slug: string,
  ): Promise<ResponseDto<ModuleResponseDto>> {
    const module = await this.moduleService.findBySlug(slug);
    const data = plainToInstance(ModuleResponseDto, module, {
      excludeExtraneousValues: true,
    });

    return {
      ok: true,
      message: 'Module retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Update a module by ID' })
  @ApiBody({ type: UpdateModuleDto })
  @ApiResponse({
    status: 200,
    description: 'Module updated successfully',
    type: ModuleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Module not found' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request (e.g., trying to change userId)',
  })
  @ApiResponse({ status: 409, description: 'Conflict: ISBN already exists' })
  async update(
    @Param('id') id: string,
    @Body() updateModuleDto: UpdateModuleDto,
  ): Promise<ResponseDto<ModuleResponseDto | null>> {
    const updatedModule = await this.moduleService.update(id, updateModuleDto);
    const data = updatedModule
      ? plainToInstance(ModuleResponseDto, updatedModule, {
          excludeExtraneousValues: true,
        })
      : null;

    return {
      ok: true,
      message: 'Module updated successfully',
      data,
    };
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Delete a module by ID' })
  @ApiResponse({
    status: 200,
    description: 'Module deleted successfully',
    type: ModuleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Module not found' })
  async delete(
    @Param('id') id: string,
  ): Promise<ResponseDto<ModuleResponseDto | null>> {
    const deletedModule = await this.moduleService.delete(id);
    const data = deletedModule
      ? plainToInstance(ModuleResponseDto, deletedModule, {
          excludeExtraneousValues: true,
        })
      : null;

    return {
      ok: true,
      message: 'Module deleted successfully',
      data,
    };
  }
}
