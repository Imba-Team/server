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
import { TermService } from './term.service';
import { CreateTermDto } from './dtos/create-term';
import { TermResponseDto } from './dtos/term-response.dto';
import { TermFilterDto } from './dtos/term-filter';
import { UpdateTermDto } from './dtos/update-term';

@ApiTags('Terms')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.USER, Role.ADMIN)
@Controller('terms')
export class TermController {
  constructor(private readonly termService: TermService) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a new term' })
  @ApiBody({ type: CreateTermDto })
  @ApiResponse({
    status: 201,
    description: 'Term created successfully',
    type: TermResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict: Term with same details already exists',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found (for the provided userId)',
  })
  async create(
    @CurrentUser() user: IUser,
    @Body() createTermDto: CreateTermDto,
  ): Promise<ResponseDto<TermResponseDto>> {
    const newTerm = await this.termService.create(user.id, createTermDto);
    const data = plainToInstance(TermResponseDto, newTerm, {
      excludeExtraneousValues: true,
    });

    return {
      ok: true,
      message: 'Term created successfully',
      data,
    };
  }

  @Get()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Get all terms with pagination and optional filters',
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
    description: 'Filter terms by owner user ID',
  })
  @ApiResponse({
    status: 200,
    description: 'List of terms returned successfully',
    type: [TermResponseDto],
  })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query() filter: TermFilterDto & { userId?: string }, // Combine with userId for query
  ): Promise<
    ResponseDto<{
      data: TermResponseDto[];
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
    } = await this.termService.findAll(page, limit, filter);

    const transformedData = plainToInstance(TermResponseDto, data, {
      excludeExtraneousValues: true,
    });

    return {
      ok: true,
      message: 'Terms retrieved successfully',
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
  @ApiOperation({ summary: 'Get a term by ID' })
  @ApiResponse({
    status: 200,
    description: 'Term returned successfully',
    type: TermResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Term not found' })
  async findOne(
    @Param('id') id: string,
  ): Promise<ResponseDto<TermResponseDto>> {
    const term = await this.termService.findById(id);
    const data = plainToInstance(TermResponseDto, term, {
      excludeExtraneousValues: true,
    });

    return {
      ok: true,
      message: 'Term retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Update a term by ID' })
  @ApiBody({ type: UpdateTermDto })
  @ApiResponse({
    status: 200,
    description: 'Term updated successfully',
    type: TermResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Term not found' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request (e.g., trying to change userId)',
  })
  @ApiResponse({ status: 409, description: 'Conflict: ISBN already exists' })
  async update(
    @Param('id') id: string,
    @Body() updateTermDto: UpdateTermDto,
  ): Promise<ResponseDto<TermResponseDto | null>> {
    const updatedTerm = await this.termService.update(id, updateTermDto);
    const data = updatedTerm
      ? plainToInstance(TermResponseDto, updatedTerm, {
          excludeExtraneousValues: true,
        })
      : null;

    return {
      ok: true,
      message: 'Term updated successfully',
      data,
    };
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Delete a term by ID' })
  @ApiResponse({
    status: 200,
    description: 'Term deleted successfully',
    type: TermResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Term not found' })
  async delete(
    @Param('id') id: string,
  ): Promise<ResponseDto<TermResponseDto | null>> {
    const deletedTerm = await this.termService.delete(id);
    const data = deletedTerm
      ? plainToInstance(TermResponseDto, deletedTerm, {
          excludeExtraneousValues: true,
        })
      : null;

    return {
      ok: true,
      message: 'Term deleted successfully',
      data,
    };
  }
}
