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
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
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
import { ModuleFilterDto } from './dtos/module-filter';
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
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'genre',
    required: false,
    type: String,
    example: 'Fantasy',
  })
  @ApiQuery({
    name: 'author',
    required: false,
    type: String,
    example: 'Tolstoy',
  })
  @ApiQuery({
    name: 'title',
    required: false,
    type: String,
    example: 'War and Peace',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    description: 'Filter modules by owner user ID',
  })
  @ApiResponse({
    status: 200,
    description: 'List of modules returned successfully',
    type: [ModuleResponseDto],
  })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query() filter: ModuleFilterDto & { userId?: string }, // Combine with userId for query
  ): Promise<
    ResponseDto<{
      data: ModuleResponseDto[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>
  > {
    const {
      data,
      total,
      page: currentPage,
      limit: currentLimit,
      totalPages,
    } = await this.moduleService.findAll(page, limit, filter);

    const transformedData = plainToInstance(ModuleResponseDto, data, {
      excludeExtraneousValues: true,
    });

    return {
      ok: true,
      message: 'Modules retrieved successfully',
      data: {
        data: transformedData,
        total,
        page: currentPage,
        limit: currentLimit,
        totalPages,
      },
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
