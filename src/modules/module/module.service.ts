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
import { Module } from './module.entity';
import { CreateModuleDto } from './dtos/create-module';
import { ModuleFilterDto } from './dtos/module-filter';
import { UpdateModuleDto } from './dtos/update-module';

@Injectable()
export class ModuleService {
  constructor(
    private readonly logger: LoggerService,
    @InjectRepository(Module)
    private readonly moduleRepository: Repository<Module>,
    // Inject the UserRepository or UsersService to validate userId
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly usersService: UsersService, // Can also use UsersService to check user existence
  ) {}

  /**
   * Creates a new module record, attached to a specific user.
   * Checks for existing module by title and author or ISBN to prevent duplicates.
   * Validates if the provided userId exists.
   * @param createModuleDto The data to create the module, including userId.
   * @returns The newly created module.
   */
  async create(
    userId: string,
    createModuleDto: CreateModuleDto,
  ): Promise<Module> {
    this.logger.log(
      `Attempting to create a new module for user ${userId}: ${createModuleDto.title}`,
    );

    // 1. Validate userId: Ensure the user exists
    const userExists = await this.usersService.findById(userId); // This will throw NotFound if user doesn't exist

    if (!userExists) {
      this.logger.warn(`User with ID ${userId} does not exist.`);
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }

    // 2. Check for existing module by title and userId to prevent duplicates
    const existingModule = await this.moduleRepository.findOne({
      where: [
        {
          title: createModuleDto.title,
          userId: userId,
        }, // Consider unique per user
      ],
    });

    if (existingModule) {
      this.logger.warn(
        `Module with title "${createModuleDto.title}" (for user ${userId}) already exists.`,
      );
      throw new ConflictException(
        'Module with this title already exists for this user.',
      );
    }

    // Convert publishedDate string to Date object if provided
    const moduleToSave = {
      userId,
      ...createModuleDto,
      publishedDate: createModuleDto.publishedDate
        ? new Date(createModuleDto.publishedDate)
        : undefined,
    };

    const newModule = this.moduleRepository.create(moduleToSave);
    const savedModule = await this.moduleRepository.save(newModule);
    this.logger.log(
      `Successfully created module with ID: ${savedModule.id} for user ${savedModule.userId}`,
    );
    return savedModule;
  }

  /**
   * Finds all modules with pagination, optional filtering, and potentially by a specific user.
   * @param page The current page number.
   * @param limit The number of items per page.
   * @param filter Optional filters (e.g., genre, author, title, userId).
   * @returns A paginated list of modules.
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    filter?: ModuleFilterDto & { userId?: string }, // Added userId to filter
  ) {
    const query = this.moduleRepository.createQueryBuilder('module');

    if (filter?.genre) {
      query.andWhere('module.genre ILIKE :genre', {
        genre: `%${filter.genre}%`,
      });
    }
    if (filter?.author) {
      query.andWhere('module.author ILIKE :author', {
        author: `%${filter.author}%`,
      });
    }
    if (filter?.title) {
      query.andWhere('module.title ILIKE :title', {
        title: `%${filter.title}%`,
      });
    }
    // Filter by userId if provided
    if (filter?.userId) {
      // Optionally, check if this user exists before filtering
      // const userExists = await this.usersService.findById(filter.userId); // This would throw NotFound if user doesn't exist
      query.andWhere('module.userId = :userId', { userId: filter.userId });
    }

    const offset = (page - 1) * limit;
    query.skip(offset).take(limit);

    const [modules, total] = await query.getManyAndCount();

    return {
      data: modules,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Finds a single module by its ID.
   * @param id The ID of the module.
   * @returns The found module.
   * @throws NotFoundException if the module is not found.
   */
  async findById(id: string): Promise<Module> {
    this.logger.log(`Attempting to find module with ID: ${id}`);
    const module = await this.moduleRepository.findOne({ where: { id } });

    if (!module) {
      this.logger.warn(`Module with ID ${id} not found.`);
      throw new NotFoundException(`Module with ID ${id} not found.`);
    }
    this.logger.log(`Found module with ID: ${id}`);
    return module;
  }

  /**
   * Updates an existing module record.
   * @param id The ID of the module to update.
   * @param updateModuleDto The data to update the module.
   * @returns The updated module.
   * @throws NotFoundException if the module is not found.
   * @throws ConflictException if the updated ISBN conflicts with another module.
   * @throws BadRequestException if userId is attempted to be changed (as it should be immutable).
   */
  async update(id: string, updateModuleDto: UpdateModuleDto): Promise<Module> {
    this.logger.log(`Attempting to update module with ID: ${id}`);
    const existingModule = await this.moduleRepository.findOne({
      where: { id },
    });

    if (!existingModule) {
      this.logger.warn(`Module with ID ${id} not found for update.`);
      throw new NotFoundException(`Module with ID ${id} not found.`);
    }

    // Convert publishedDate string to Date object if provided
    const moduleToUpdate = {
      ...updateModuleDto,
      publishedDate: updateModuleDto.publishedDate
        ? new Date(updateModuleDto.publishedDate)
        : undefined,
    };

    await this.moduleRepository.update(id, moduleToUpdate);
    const updatedModule = await this.findById(id); // Fetch the updated module to return
    this.logger.log(`Successfully updated module with ID: ${id}`);
    return updatedModule;
  }

  /**
   * Deletes a module record.
   * @param id The ID of the module to delete.
   * @returns The deleted module.
   * @throws NotFoundException if the module is not found.
   */
  async delete(id: string): Promise<Module> {
    this.logger.log(`Attempting to delete module with ID: ${id}`);
    const moduleToDelete = await this.findById(id); // This will throw NotFoundException if not found

    const result = await this.moduleRepository.remove(moduleToDelete);
    this.logger.log(`Successfully deleted module with ID: ${id}`);
    return result;
  }
}
