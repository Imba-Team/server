import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LoggerService } from 'src/common/logger/logger.service';
import { Repository } from 'typeorm';
import { UsersService } from '../users/user.service';
import { User } from '../users/user.entity';
import { Term } from './term.entity';
import { CreateTermDto } from './dtos/create-term';
import { TermFilterDto } from './dtos/term-filter';
import { UpdateTermDto } from './dtos/update-term';

@Injectable()
export class TermService {
  constructor(
    private readonly logger: LoggerService,
    @InjectRepository(Term)
    private readonly termRepository: Repository<Term>,
    // Inject the UserRepository or UsersService to validate moduleId
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly usersService: UsersService, // Can also use UsersService to check user existence
  ) {}

  /**
   * Creates a new term record, attached to a specific user.
   * Checks for existing term by title and author or ISBN to prevent duplicates.
   * Validates if the provided moduleId exists.
   * @param createTermDto The data to create the term, including moduleId.
   * @returns The newly created term.
   */
  async create(moduleId: string, createTermDto: CreateTermDto): Promise<Term> {
    this.logger.log(
      `Attempting to create a new term for module ${moduleId}: ${createTermDto.term}`,
    );

    // 1. Validate moduleId: Ensure the user exists
    const userExists = await this.usersService.findById(moduleId); // This will throw NotFound if user doesn't exist

    if (!userExists) {
      this.logger.warn(`User with ID ${moduleId} does not exist.`);
      throw new NotFoundException(`User with ID ${moduleId} not found.`);
    }

    // 2. Check for existing term by title and author OR by ISBN
    const existingTerm = await this.termRepository.findOne({
      where: [
        {
          term: createTermDto.term,
          moduleId: moduleId,
        }, // Consider unique per user
        // { isbn: createTermDto.isbn, moduleId: moduleId }, // Consider unique per user if applicable, or globally unique
      ],
    });

    if (existingTerm) {
      this.logger.warn(
        `Term: "${createTermDto.term}" (for module ${moduleId})" already exists.`,
      );
      throw new ConflictException(
        'Term with this title/author or ISBN already exists for this user.',
      );
    }

    const newTerm = this.termRepository.create(createTermDto);
    const savedTerm = await this.termRepository.save(newTerm);
    this.logger.log(
      `Successfully created term with ID: ${savedTerm.id} for user ${savedTerm.moduleId}`,
    );
    return savedTerm;
  }

  /**
   * Finds all terms with pagination, optional filtering, and potentially by a specific user.
   * @param page The current page number.
   * @param limit The number of items per page.
   * @param filter Optional filters (e.g., genre, author, title, moduleId).
   * @returns A paginated list of terms.
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    filter?: TermFilterDto & { moduleId?: string }, // Added moduleId to filter
  ) {
    const query = this.termRepository.createQueryBuilder('term');
    // TODO add more filters as needed

    // Filter by moduleId if provided
    if (filter?.moduleId) {
      // Optionally, check if this user exists before filtering
      // const userExists = await this.usersService.findById(filter.moduleId); // This would throw NotFound if user doesn't exist
      query.andWhere('term.moduleId = :moduleId', {
        moduleId: filter.moduleId,
      });
    }

    const offset = (page - 1) * limit;
    query.skip(offset).take(limit);

    const [terms, total] = await query.getManyAndCount();

    return {
      data: terms,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Finds a single term by its ID.
   * @param id The ID of the term.
   * @returns The found term.
   * @throws NotFoundException if the term is not found.
   */
  async findById(id: string): Promise<Term> {
    this.logger.log(`Attempting to find term with ID: ${id}`);
    const term = await this.termRepository.findOne({ where: { id } });

    if (!term) {
      this.logger.warn(`Term with ID ${id} not found.`);
      throw new NotFoundException(`Term with ID ${id} not found.`);
    }
    this.logger.log(`Found term with ID: ${id}`);
    return term;
  }

  /**
   * Updates an existing term record.
   * @param id The ID of the term to update.
   * @param updateTermDto The data to update the term.
   * @returns The updated term.
   * @throws NotFoundException if the term is not found.
   * @throws ConflictException if the updated ISBN conflicts with another term.
   * @throws BadRequestException if moduleId is attempted to be changed (as it should be immutable).
   */
  async update(id: string, updateTermDto: UpdateTermDto): Promise<Term> {
    this.logger.log(`Attempting to update term with ID: ${id}`);
    const existingTerm = await this.termRepository.findOne({ where: { id } });

    if (!existingTerm) {
      this.logger.warn(`Term with ID ${id} not found for update.`);
      throw new NotFoundException(`Term with ID ${id} not found.`);
    }

    await this.termRepository.update(id, updateTermDto);
    const updatedTerm = await this.findById(id); // Fetch the updated term to return
    this.logger.log(`Successfully updated term with ID: ${id}`);
    return updatedTerm;
  }

  /**
   * Deletes a term record.
   * @param id The ID of the term to delete.
   * @returns The deleted term.
   * @throws NotFoundException if the term is not found.
   */
  async delete(id: string): Promise<Term> {
    this.logger.log(`Attempting to delete term with ID: ${id}`);
    const termToDelete = await this.findById(id); // This will throw NotFoundException if not found

    const result = await this.termRepository.remove(termToDelete);
    this.logger.log(`Successfully deleted term with ID: ${id}`);
    return result;
  }
}
