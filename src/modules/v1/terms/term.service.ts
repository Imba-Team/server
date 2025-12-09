import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LoggerService } from 'src/common/logger/logger.service';
import { Repository } from 'typeorm';
import { Term } from './term.entity';
import { CreateTermDto } from './dtos/create-term';
import { TermFilterDto } from './dtos/term-filter.dto';
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

  async create(userId: string, createTermDto: CreateTermDto): Promise<Term> {
    this.logger.log(
      `Attempting to create a new term: ${createTermDto.term} for module ${createTermDto.moduleId}`,
    );

    // 1. Validate moduleId: Ensure the module exists
    const moduleExists = await this.moduleRepository.findOne({
      where: { id: createTermDto.moduleId },
    });

    if (!moduleExists) {
      this.logger.warn(
        `Module with ID ${createTermDto.moduleId} does not exist.`,
      );
      throw new NotFoundException(
        `Module with ID ${createTermDto.moduleId} not found.`,
      );
    }

    // 2. Verify ownership: Only module owner can add terms
    if (moduleExists.userId !== userId) {
      this.logger.warn(
        `User ${userId} attempted to add term to module ${createTermDto.moduleId} owned by ${moduleExists.userId}`,
      );
      throw new ForbiddenException(
        'You can only add terms to your own modules',
      );
    }

    // 3. Check for existing term by term and moduleId
    const existingTerm = await this.termRepository.findOne({
      where: [
        {
          term: createTermDto.term,
          moduleId: createTermDto.moduleId,
        },
      ],
    });

    if (existingTerm) {
      this.logger.warn(
        `Term: "${createTermDto.term}" (for module ${createTermDto.moduleId})" already exists.`,
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

  async findAll(filter: TermFilterDto) {
    const query = this.termRepository.createQueryBuilder('term');

    if (filter.status) {
      query.andWhere('term.status = :status', { status: filter.status });
    }

    if (filter.isStarred !== undefined) {
      query.andWhere('term.isStarred = :isStarred', {
        isStarred: filter.isStarred,
      });
    }

    if (filter.moduleId) {
      query.andWhere('term.moduleId = :moduleId', {
        moduleId: filter.moduleId,
      });
    }

    const [terms, total] = await query.getManyAndCount();

    return { data: terms, total };
  }

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

  async update(
    userId: string,
    id: string,
    updateTermDto: UpdateTermDto,
  ): Promise<Term> {
    this.logger.log(`Attempting to update term with ID: ${id}`);
    const existingTerm = await this.termRepository.findOne({
      where: { id },
      relations: ['module'],
    });

    if (!existingTerm) {
      this.logger.warn(`Term with ID ${id} not found for update.`);
      throw new NotFoundException(`Term with ID ${id} not found.`);
    }

    // Verify ownership through module
    if (existingTerm.module.userId !== userId) {
      this.logger.warn(
        `User ${userId} attempted to update term ${id} in module owned by ${existingTerm.module.userId}`,
      );
      throw new ForbiddenException(
        'You can only modify terms in your own modules',
      );
    }

    await this.termRepository.update(id, updateTermDto);
    const updatedTerm = await this.findById(id); // Fetch the updated term to return
    this.logger.log(`Successfully updated term with ID: ${id}`);
    return updatedTerm;
  }

  async updateStatus(
    userId: string,
    id: string,
    success: boolean,
  ): Promise<Term> {
    this.logger.log(
      `Attempting to ${success ? 'upgrade' : 'decrease'} status of term with ID: ${id}`,
    );
    const existingTerm = await this.termRepository.findOne({
      where: { id },
      relations: ['module'],
    });

    if (!existingTerm) {
      this.logger.warn(`Term with ID ${id} not found for status update.`);
      throw new NotFoundException(`Term with ID ${id} not found.`);
    }

    // Verify ownership through module
    if (existingTerm.module.userId !== userId) {
      this.logger.warn(
        `User ${userId} attempted to update status of term ${id} in module owned by ${existingTerm.module.userId}`,
      );
      throw new ForbiddenException(
        'You can only modify terms in your own modules',
      );
    }

    const currentStatus = existingTerm.status;
    let newStatus = currentStatus;

    // Upgrade rules (success === true):
    // not_started -> in_progress
    // in_progress -> completed
    // completed -> completed (unchanged)
    if (success) {
      if (currentStatus === 'not_started') {
        newStatus = 'in_progress';
      } else if (currentStatus === 'in_progress') {
        newStatus = 'completed';
      }
    } else {
      // Decrease rules (success === false):
      // completed -> in_progress
      // in_progress -> in_progress (unchanged)
      // not_started -> in_progress
      newStatus = 'in_progress';
    }

    if (newStatus !== currentStatus) {
      existingTerm.status = newStatus;
      const updatedTerm = await this.termRepository.save(existingTerm);
      this.logger.log(
        `Successfully ${success ? 'upgraded' : 'decreased'} status of term with ID: ${id} to ${newStatus}`,
      );
      return updatedTerm;
    }

    this.logger.log(
      `No status change required for term with ID: ${id} (status: ${currentStatus})`,
    );
    return existingTerm;
  }

  async delete(userId: string, id: string): Promise<Term> {
    this.logger.log(`Attempting to delete term with ID: ${id}`);
    const termToDelete = await this.termRepository.findOne({
      where: { id },
      relations: ['module'],
    });

    if (!termToDelete) {
      this.logger.warn(`Term with ID ${id} not found.`);
      throw new NotFoundException(`Term with ID ${id} not found.`);
    }

    // Verify ownership through module
    if (termToDelete.module.userId !== userId) {
      this.logger.warn(
        `User ${userId} attempted to delete term ${id} in module owned by ${termToDelete.module.userId}`,
      );
      throw new ForbiddenException(
        'You can only delete terms from your own modules',
      );
    }

    const result = await this.termRepository.remove(termToDelete);
    this.logger.log(`Successfully deleted term with ID: ${id}`);
    return result;
  }
}
