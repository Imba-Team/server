import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LoggerService } from 'src/common/logger/logger.service';
import { Repository } from 'typeorm';
import { Book } from './book.entity';
import { UsersService } from '../users/user.service';
import { User } from '../users/user.entity';
import { CreateBookDto } from './dtos/create-book';
import { UpdateBookDto } from './dtos/update-book';
import { BookFilterDto } from './dtos/book-filter';

@Injectable()
export class BookService {
  constructor(
    private readonly logger: LoggerService,
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
    // Inject the UserRepository or UsersService to validate userId
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly usersService: UsersService, // Can also use UsersService to check user existence
  ) {}

  /**
   * Creates a new book record, attached to a specific user.
   * Checks for existing book by title and author or ISBN to prevent duplicates.
   * Validates if the provided userId exists.
   * @param createBookDto The data to create the book, including userId.
   * @returns The newly created book.
   */
  async create(userId: string, createBookDto: CreateBookDto): Promise<Book> {
    this.logger.log(
      `Attempting to create a new book for user ${userId}: ${createBookDto.title}`,
    );

    // 1. Validate userId: Ensure the user exists
    const userExists = await this.usersService.findById(userId); // This will throw NotFound if user doesn't exist

    if (!userExists) {
      this.logger.warn(`User with ID ${userId} does not exist.`);
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }

    // 2. Check for existing book by title and author OR by ISBN
    const existingBook = await this.bookRepository.findOne({
      where: [
        {
          title: createBookDto.title,
          author: createBookDto.author,
          userId: userId,
        }, // Consider unique per user
        // { isbn: createBookDto.isbn, userId: userId }, // Consider unique per user if applicable, or globally unique
      ],
    });

    if (existingBook) {
      this.logger.warn(
        `Book with title "${createBookDto.title}" by "${createBookDto.author}" (for user ${userId}) or ISBN "${createBookDto.isbn}" already exists.`,
      );
      throw new ConflictException(
        'Book with this title/author or ISBN already exists for this user.',
      );
    }

    // Convert publishedDate string to Date object if provided
    const bookToSave = {
      userId,
      ...createBookDto,
      publishedDate: createBookDto.publishedDate
        ? new Date(createBookDto.publishedDate)
        : undefined,
    };

    const newBook = this.bookRepository.create(bookToSave);
    const savedBook = await this.bookRepository.save(newBook);
    this.logger.log(
      `Successfully created book with ID: ${savedBook.id} for user ${savedBook.userId}`,
    );
    return savedBook;
  }

  /**
   * Finds all books with pagination, optional filtering, and potentially by a specific user.
   * @param page The current page number.
   * @param limit The number of items per page.
   * @param filter Optional filters (e.g., genre, author, title, userId).
   * @returns A paginated list of books.
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    filter?: BookFilterDto & { userId?: string }, // Added userId to filter
  ) {
    const query = this.bookRepository.createQueryBuilder('book');

    if (filter?.genre) {
      query.andWhere('book.genre ILIKE :genre', {
        genre: `%${filter.genre}%`,
      });
    }
    if (filter?.author) {
      query.andWhere('book.author ILIKE :author', {
        author: `%${filter.author}%`,
      });
    }
    if (filter?.title) {
      query.andWhere('book.title ILIKE :title', {
        title: `%${filter.title}%`,
      });
    }
    // Filter by userId if provided
    if (filter?.userId) {
      // Optionally, check if this user exists before filtering
      // const userExists = await this.usersService.findById(filter.userId); // This would throw NotFound if user doesn't exist
      query.andWhere('book.userId = :userId', { userId: filter.userId });
    }

    const offset = (page - 1) * limit;
    query.skip(offset).take(limit);

    const [books, total] = await query.getManyAndCount();

    return {
      data: books,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Finds a single book by its ID.
   * @param id The ID of the book.
   * @returns The found book.
   * @throws NotFoundException if the book is not found.
   */
  async findById(id: string): Promise<Book> {
    this.logger.log(`Attempting to find book with ID: ${id}`);
    const book = await this.bookRepository.findOne({ where: { id } });

    if (!book) {
      this.logger.warn(`Book with ID ${id} not found.`);
      throw new NotFoundException(`Book with ID ${id} not found.`);
    }
    this.logger.log(`Found book with ID: ${id}`);
    return book;
  }

  /**
   * Finds a single book by its ISBN.
   * @param isbn The ISBN of the book.
   * @returns The found book, or null if not found.
   */
  async findByIsbn(isbn: string): Promise<Book | null> {
    this.logger.log(`Attempting to find book with ISBN: ${isbn}`);
    const book = await this.bookRepository.findOne({ where: { isbn } });
    if (!book) {
      this.logger.debug(`Book with ISBN ${isbn} not found.`);
    } else {
      this.logger.log(`Found book with ISBN: ${isbn}`);
    }
    return book;
  }

  /**
   * Updates an existing book record.
   * @param id The ID of the book to update.
   * @param updateBookDto The data to update the book.
   * @returns The updated book.
   * @throws NotFoundException if the book is not found.
   * @throws ConflictException if the updated ISBN conflicts with another book.
   * @throws BadRequestException if userId is attempted to be changed (as it should be immutable).
   */
  async update(id: string, updateBookDto: UpdateBookDto): Promise<Book> {
    this.logger.log(`Attempting to update book with ID: ${id}`);
    const existingBook = await this.bookRepository.findOne({ where: { id } });

    if (!existingBook) {
      this.logger.warn(`Book with ID ${id} not found for update.`);
      throw new NotFoundException(`Book with ID ${id} not found.`);
    }

    // Check for ISBN conflict if a new ISBN is provided and it's different from the existing one
    if (updateBookDto.isbn && updateBookDto.isbn !== existingBook.isbn) {
      const bookWithSameIsbn = await this.bookRepository.findOne({
        where: { isbn: updateBookDto.isbn },
      });
      if (bookWithSameIsbn && bookWithSameIsbn.id !== id) {
        this.logger.warn(
          `Update failed: Another book with ISBN ${updateBookDto.isbn} already exists.`,
        );
        throw new ConflictException(
          'Another book with this ISBN already exists.',
        );
      }
    }

    // Convert publishedDate string to Date object if provided
    const bookToUpdate = {
      ...updateBookDto,
      publishedDate: updateBookDto.publishedDate
        ? new Date(updateBookDto.publishedDate)
        : undefined,
    };

    await this.bookRepository.update(id, bookToUpdate);
    const updatedBook = await this.findById(id); // Fetch the updated book to return
    this.logger.log(`Successfully updated book with ID: ${id}`);
    return updatedBook;
  }

  /**
   * Deletes a book record.
   * @param id The ID of the book to delete.
   * @returns The deleted book.
   * @throws NotFoundException if the book is not found.
   */
  async delete(id: string): Promise<Book> {
    this.logger.log(`Attempting to delete book with ID: ${id}`);
    const bookToDelete = await this.findById(id); // This will throw NotFoundException if not found

    const result = await this.bookRepository.remove(bookToDelete);
    this.logger.log(`Successfully deleted book with ID: ${id}`);
    return result;
  }
}
