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
import { BookService } from './book.service';
import { JwtGuard } from 'src/guards/jwt.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { Role, Roles } from 'src/common/decorators/roles.decorator';
import { ResponseDto } from 'src/common/interfaces/response.dto';
import { plainToInstance } from 'class-transformer';
import { CreateBookDto } from './dtos/create-book';
import { BookFilterDto } from './dtos/book-filter';
import { UpdateBookDto } from './dtos/update-book';
import { BookResponseDto } from './dtos/book-response.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { IUser } from 'src/common/interfaces/user.interface';

@ApiTags('Books')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.USER, Role.ADMIN)
@Controller('books')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a new book' })
  @ApiBody({ type: CreateBookDto })
  @ApiResponse({
    status: 201,
    description: 'Book created successfully',
    type: BookResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict: Book with same details already exists',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found (for the provided userId)',
  })
  async create(
    @CurrentUser() user: IUser,
    @Body() createBookDto: CreateBookDto,
  ): Promise<ResponseDto<BookResponseDto>> {
    const newBook = await this.bookService.create(user.id, createBookDto);
    const data = plainToInstance(BookResponseDto, newBook, {
      excludeExtraneousValues: true,
    });

    return {
      ok: true,
      message: 'Book created successfully',
      data,
    };
  }

  @Get()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Get all books with pagination and optional filters',
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
    description: 'Filter books by owner user ID',
  })
  @ApiResponse({
    status: 200,
    description: 'List of books returned successfully',
    type: [BookResponseDto],
  })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query() filter: BookFilterDto & { userId?: string }, // Combine with userId for query
  ): Promise<
    ResponseDto<{
      data: BookResponseDto[];
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
    } = await this.bookService.findAll(page, limit, filter);

    const transformedData = plainToInstance(BookResponseDto, data, {
      excludeExtraneousValues: true,
    });

    return {
      ok: true,
      message: 'Books retrieved successfully',
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
  @ApiOperation({ summary: 'Get a book by ID' })
  @ApiResponse({
    status: 200,
    description: 'Book returned successfully',
    type: BookResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Book not found' })
  async findOne(
    @Param('id') id: string,
  ): Promise<ResponseDto<BookResponseDto>> {
    const book = await this.bookService.findById(id);
    const data = plainToInstance(BookResponseDto, book, {
      excludeExtraneousValues: true,
    });

    return {
      ok: true,
      message: 'Book retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Update a book by ID' })
  @ApiBody({ type: UpdateBookDto })
  @ApiResponse({
    status: 200,
    description: 'Book updated successfully',
    type: BookResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Book not found' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request (e.g., trying to change userId)',
  })
  @ApiResponse({ status: 409, description: 'Conflict: ISBN already exists' })
  async update(
    @Param('id') id: string,
    @Body() updateBookDto: UpdateBookDto,
  ): Promise<ResponseDto<BookResponseDto | null>> {
    const updatedBook = await this.bookService.update(id, updateBookDto);
    const data = updatedBook
      ? plainToInstance(BookResponseDto, updatedBook, {
          excludeExtraneousValues: true,
        })
      : null;

    return {
      ok: true,
      message: 'Book updated successfully',
      data,
    };
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Delete a book by ID' })
  @ApiResponse({
    status: 200,
    description: 'Book deleted successfully',
    type: BookResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Book not found' })
  async delete(
    @Param('id') id: string,
  ): Promise<ResponseDto<BookResponseDto | null>> {
    const deletedBook = await this.bookService.delete(id);
    const data = deletedBook
      ? plainToInstance(BookResponseDto, deletedBook, {
          excludeExtraneousValues: true,
        })
      : null;

    return {
      ok: true,
      message: 'Book deleted successfully',
      data,
    };
  }
}
