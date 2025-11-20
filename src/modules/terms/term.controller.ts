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
import { TermFilterDto } from './dtos/term-filter.dto';
import { UpdateTermDto } from './dtos/update-term';
import { AuthService } from '../auth/auth.service';

@ApiTags('Terms')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.USER, Role.ADMIN)
@Controller('terms')
export class TermController {
  constructor(
    private readonly termService: TermService,
    private readonly authService: AuthService,
  ) {}

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
    const newTerm = await this.termService.create(createTermDto);

    return {
      ok: true,
      message: 'Term created successfully',
      data: newTerm,
    };
  }

  @Get()
  @HttpCode(200)
  @ApiOperation({ summary: 'Get all terms with optional filters' })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    enum: ['not_studied', 'in_progress', 'completed'],
  })
  @ApiQuery({
    name: 'isStarred',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'moduleId',
    required: false,
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'List of terms returned successfully',
    type: [TermResponseDto],
  })
  async findAll(@Query() filter: TermFilterDto) {
    const { data, total } = await this.termService.findAll(filter);

    return {
      ok: true,
      message: 'Terms retrieved successfully',
      data: {
        data: plainToInstance(TermResponseDto, data, {
          excludeExtraneousValues: true,
        }),
        total,
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
    description: 'Bad Request (e.g., trying to change moduleId)',
  })
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
