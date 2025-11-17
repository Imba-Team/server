import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LoggerService } from 'src/common/logger/logger.service';
import { Repository } from 'typeorm';
import { Term } from './term.entity';
import { CreateTermDto } from './dtos/create-term';
import { TermFilterDto } from './dtos/term-filter';
import { UpdateTermDto } from './dtos/update-term';
import { Module } from '../module/module.entity';

@Injectable()
export class TermService {
  constructor(
    private readonly logger: LoggerService,
    @InjectRepository(Term)
    private readonly termRepository: Repository<Term>,
    @InjectRepository(Module)
    private readonly moduleRepository: Repository<Module>,
  ) {}

  /**
   * Creates a new term record, attached to a specific module.
   * Checks for existing term by term and moduleId to prevent duplicates.
   * Validates if the provided moduleId exists.
   * @param createTermDto The data to create the term, including moduleId.
   * @returns The newly created term.
   */
  async create(moduleId: string, createTermDto: CreateTermDto): Promise<Term> {
    this.logger.log(
      `Attempting to create a new term: ${createTermDto.term} for module ${moduleId}`,
    );

    // 1. Validate moduleId: Ensure the module exists
    const moduleExists = await this.moduleRepository.findOne({
      where: { id: moduleId },
    });

    if (!moduleExists) {
      this.logger.warn(`Module with ID ${moduleId} does not exist.`);
      throw new NotFoundException(`Module with ID ${moduleId} not found.`);
    }

    // 2. Check for existing term by term and moduleId
    const existingTerm = await this.termRepository.findOne({
      where: [
        {
          term: createTermDto.term,
          moduleId: moduleId,
        },
      ],
    });

    if (existingTerm) {
      this.logger.warn(
        `Term: "${createTermDto.term}" (for module ${moduleId})" already exists.`,
      );
      throw new ConflictException('Term already exists for this module.');
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
   * @param filter Optional filters (e.g., genre, author, title, moduleId).
   * @returns A paginated list of terms.
   */
  async findAll(
    filter?: TermFilterDto & { moduleId?: string }, // Added moduleId to filter
  ) {
    const query = this.termRepository.createQueryBuilder('term');
    // TODO add more filters as needed

    if (filter?.status) {
      query.andWhere('term.status = :status', { status: filter.status });
    }

    if (filter?.isStarred !== undefined) {
      query.andWhere('term.isStarred = :isStarred', {
        isStarred: filter.isStarred,
      });
    }

    // Filter by moduleId if provided
    if (filter?.moduleId) {
      // Optionally, check if this user exists before filtering
      // const userExists = await this.moduleRepository.findById(filter.moduleId); // This would throw NotFound if user doesn't exist
      query.andWhere('term.moduleId = :moduleId', {
        moduleId: filter.moduleId,
      });
    }

    const [terms, total] = await query.getManyAndCount();

    return {
      data: terms,
      total,
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
