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
import { UpdateModuleDto } from './dtos/update-module';
import { slugify } from 'src/common/utils/sligify';

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

    const slug = slugify(createModuleDto.title);

    // Attach the owner userId to the module before saving to satisfy NOT NULL constraint
    const newModule = this.moduleRepository.create({
      ...createModuleDto,
      userId,
      slug,
    });
    const savedModule = await this.moduleRepository.save(newModule);
    this.logger.log(
      `Successfully created module with ID: ${savedModule.id} for user ${savedModule.userId}`,
    );
    return savedModule;
  }

  async findAll() {
    const modules = await this.moduleRepository.find();

    this.logger.log(`Retrieved ${modules.length} modules from the database.`);

    return modules;
  }

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

  async findBySlug(slug: string): Promise<Module> {
    this.logger.log(`Attempting to find module with slug: ${slug}`);
    const module = await this.moduleRepository.findOne({ where: { slug } });

    if (!module) {
      this.logger.warn(`Module with slug ${slug} not found.`);
      throw new NotFoundException(`Module with slug ${slug} not found.`);
    }
    this.logger.log(`Found module with slug: ${slug}`);
    return module;
  }

  async update(id: string, updateModuleDto: UpdateModuleDto): Promise<Module> {
    this.logger.log(`Attempting to update module with ID: ${id}`);
    const existingModule = await this.moduleRepository.findOne({
      where: { id },
    });

    if (!existingModule) {
      this.logger.warn(`Module with ID ${id} not found for update.`);
      throw new NotFoundException(`Module with ID ${id} not found.`);
    }

    await this.moduleRepository.update(id, updateModuleDto);
    const updatedModule = await this.findById(id); // Fetch the updated module to return
    this.logger.log(`Successfully updated module with ID: ${id}`);
    return updatedModule;
  }

  async delete(id: string): Promise<Module> {
    this.logger.log(`Attempting to delete module with ID: ${id}`);
    const moduleToDelete = await this.findById(id); // This will throw NotFoundException if not found

    const result = await this.moduleRepository.remove(moduleToDelete);
    this.logger.log(`Successfully deleted module with ID: ${id}`);
    return result;
  }
}
