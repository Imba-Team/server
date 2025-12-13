import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { LoggerService } from 'src/common/logger/logger.service';
import { Module } from '../../v1/module/module.entity';
import { User } from '../../users/user.entity';
import { UsersService } from '../../users/user.service';
import { CreateModuleV2Dto } from './dtos/create-module.dto';
import { UpdateModuleV2Dto } from './dtos/update-module.dto';
import { UpdateVisibilityDto } from './dtos/update-visibility.dto';
import { slugify } from 'src/common/utils/sligify';
import { UserModule } from './user-module.entity';
import { Term } from '../../v1/terms/term.entity';
import { UserTermProgress } from '../term/user-term-progress.entity';
import { SearchModulesDto } from './dtos/search-modules.dto';
import { plainToInstance } from 'class-transformer';
import { ModuleResponseV2Dto } from './dtos/module-response.dto';
import { TermWithProgressDto } from '../term/dtos/term-with-progress.dto';

@Injectable()
export class ModuleV2Service {
  constructor(
    private readonly logger: LoggerService,
    @InjectRepository(Module)
    private readonly moduleRepository: Repository<Module>,
    @InjectRepository(UserModule)
    private readonly userModuleRepository: Repository<UserModule>,
    @InjectRepository(UserTermProgress)
    private readonly userTermProgressRepository: Repository<UserTermProgress>,
    @InjectRepository(Term)
    private readonly termRepository: Repository<Term>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly usersService: UsersService,
  ) {}

  async create(userId: string, dto: CreateModuleV2Dto) {
    await this.usersService.findById(userId);

    const slug = slugify(dto.title);

    // Combine duplicate checks into single query
    const duplicate = await this.moduleRepository.findOne({
      where: [{ slug }, { title: dto.title }],
    });

    if (duplicate) {
      if (duplicate.slug === slug) {
        throw new ConflictException('Module slug already exists');
      }
      throw new ConflictException('Module title already exists');
    }

    const newModule = this.moduleRepository.create({
      ...dto,
      slug,
      userId,
    });

    const saved = await this.moduleRepository.save(newModule);

    await this.ensureUserModule(userId, saved.id, true);

    return this.buildModuleForUser(saved.id, userId, true, true);
  }

  async update(userId: string, moduleId: string, dto: UpdateModuleV2Dto) {
    await this.ensureOwnedModule(userId, moduleId);
    await this.moduleRepository.update(moduleId, dto);
    return this.buildModuleForUser(moduleId, userId, true);
  }

  async updateVisibility(
    userId: string,
    moduleId: string,
    visibilityDto: UpdateVisibilityDto,
  ) {
    await this.ensureOwnedModule(userId, moduleId);
    await this.moduleRepository.update(moduleId, {
      isPrivate: visibilityDto.isPrivate,
    });

    return this.buildModuleForUser(moduleId, userId, true);
  }

  // Get modules owned by user with progress info
  async findCreatedModules(userId: string) {
    const modules = await this.moduleRepository.find({
      where: { userId },
      relations: ['terms'],
    });
    return this.buildModulesForUserBatch(modules, userId, false);
  }

  async findCollection(userId: string) {
    const links = await this.userModuleRepository.find({
      where: { userId },
      relations: ['module', 'module.terms'],
    });

    const modules = links.map((link) => link.module);
    return this.buildModulesForUserBatch(modules, userId, false);
  }

  async searchPublic(userId: string, query: SearchModulesDto) {
    const qb = this.moduleRepository
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.terms', 't')
      .where('m.isPrivate = :isPrivate', { isPrivate: false });

    if (query.q) {
      qb.andWhere(
        '(LOWER(m.title) LIKE LOWER(:search) OR LOWER(m.description) LIKE LOWER(:search))',
        {
          search: `%${query.q}%`,
        },
      );
    }

    const modules = await qb.getMany();

    return this.buildModulesForUserBatch(modules, userId, false);
  }

  async addToCollection(userId: string, moduleId: string) {
    const module = await this.findModuleOrFail(moduleId);
    this.assertAccessible(module, userId);

    await this.ensureUserModule(userId, moduleId, false);

    return this.buildModuleForUser(moduleId, userId, true);
  }

  async removeFromCollection(userId: string, moduleId: string) {
    const module = await this.findModuleOrFail(moduleId);
    this.assertAccessible(module, userId);

    const isOwner = module.userId === userId;
    if (isOwner) {
      throw new ForbiddenException(
        'Cannot remove your own module from collection',
      );
    }

    await this.userModuleRepository.delete({ userId, moduleId });

    return this.buildModuleForUser(moduleId, userId, true, false);
  }

  async getById(userId: string, moduleId: string) {
    const module = await this.moduleRepository.findOne({
      where: { id: moduleId },
      relations: ['terms'],
    });

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    this.assertAccessible(module, userId);

    const isOwner = module.userId === userId;
    const isCollected =
      isOwner ||
      (await this.userModuleRepository.exist({
        where: { userId, moduleId },
      }));

    if (isCollected) {
      await this.ensureUserModule(userId, moduleId, isOwner);
    }

    return this.buildModuleForUser(module, userId, true, isCollected);
  }

  private async buildModuleForUser(
    moduleOrId: Module | string,
    userId: string,
    includeTerms = false,
    alreadyCollected?: boolean,
  ): Promise<ModuleResponseV2Dto> {
    const module =
      typeof moduleOrId === 'string'
        ? await this.moduleRepository.findOne({
            where: { id: moduleOrId },
            relations: ['terms'],
          })
        : moduleOrId;

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    const isOwner = module.userId === userId;
    const isCollected = alreadyCollected ?? isOwner;
    const terms = module.terms || [];

    if (isCollected && terms.length) {
      await this.ensureProgressRecords(
        userId,
        module.id,
        module.userId === userId,
      );
    }

    const [progress, owner] = await Promise.all([
      this.calculateProgressForUser(userId, module.id, terms, isCollected),
      this.userRepository.findOne({
        where: { id: module.userId },
        select: ['id', 'name', 'profilePicture'],
      }),
    ]);

    const termsWithProgress = includeTerms
      ? await this.attachTermProgress(userId, module.id, terms, isCollected)
      : undefined;

    return plainToInstance(
      ModuleResponseV2Dto,
      {
        ...module,
        ownerName: owner?.name,
        ownerImg: owner?.profilePicture,
        isOwner,
        isCollected,
        termsCount: terms.length,
        progress,
        terms: termsWithProgress,
      },
      { excludeExtraneousValues: true },
    );
  }

  private async attachTermProgress(
    userId: string,
    moduleId: string,
    terms: Term[],
    isCollected: boolean,
  ): Promise<TermWithProgressDto[]> {
    if (!terms.length) return [];

    if (!isCollected) {
      return terms.map((term) =>
        plainToInstance(
          TermWithProgressDto,
          {
            ...term,
            status: 'not_started',
            isStarred: false,
          },
          { excludeExtraneousValues: true },
        ),
      );
    }

    const termIds = terms.map((t) => t.id);
    const progressRows = await this.userTermProgressRepository.find({
      where: { userId, termId: In(termIds) },
    });

    const progressMap = new Map(progressRows.map((p) => [p.termId, p]));

    return terms.map((term) => {
      const progress = progressMap.get(term.id);
      return plainToInstance(
        TermWithProgressDto,
        {
          ...term,
          status: progress?.status ?? 'not_started',
          isStarred: progress?.isStarred ?? false,
        },
        { excludeExtraneousValues: true },
      );
    });
  }

  private async calculateProgressForUser(
    userId: string,
    moduleId: string,
    terms: Term[],
    isCollected: boolean,
  ): Promise<{ not_started: number; in_progress: number; completed: number }> {
    const defaultProgress = {
      not_started: terms.length ? 1 : 0,
      in_progress: 0,
      completed: 0,
    };

    if (!isCollected || !terms.length) {
      return defaultProgress;
    }

    const termIds = terms.map((t) => t.id);
    const progressRows = await this.userTermProgressRepository.find({
      where: { userId, termId: In(termIds) },
    });

    if (!progressRows.length) {
      return defaultProgress;
    }

    const counts = progressRows.reduce(
      (acc, row) => {
        acc[row.status]++;
        return acc;
      },
      { not_started: 0, in_progress: 0, completed: 0 },
    );

    const total = terms.length;

    return {
      not_started: counts.not_started / total,
      in_progress: counts.in_progress / total,
      completed: counts.completed / total,
    };
  }

  private async ensureProgressRecords(
    userId: string,
    moduleId: string,
    seedFromExistingStatus: boolean,
  ) {
    const terms = await this.termRepository.find({ where: { moduleId } });
    if (!terms.length) return;

    const termIds = terms.map((t) => t.id);
    const existing = await this.userTermProgressRepository.find({
      where: { userId, termId: In(termIds) },
    });

    const existingMap = new Set(existing.map((e) => e.termId));

    const missing = terms
      .filter((t) => !existingMap.has(t.id))
      .map((term) =>
        this.userTermProgressRepository.create({
          userId,
          termId: term.id,
          status: seedFromExistingStatus ? term.status : 'not_started',
          isStarred: seedFromExistingStatus ? term.isStarred : false,
        }),
      );

    if (missing.length) {
      await this.userTermProgressRepository.save(missing);
    }
  }

  private async ensureUserModule(
    userId: string,
    moduleId: string,
    seedProgressFromTerm = false,
  ): Promise<void> {
    const exists = await this.userModuleRepository.exist({
      where: { userId, moduleId },
    });

    if (!exists) {
      const link = this.userModuleRepository.create({ userId, moduleId });
      await this.userModuleRepository.save(link);
    }

    await this.ensureProgressRecords(userId, moduleId, seedProgressFromTerm);
  }

  private async ensureOwnedModule(userId: string, moduleId: string) {
    const module = await this.findModuleOrFail(moduleId);
    if (module.userId !== userId) {
      throw new ForbiddenException('You can only modify your own modules');
    }
    return module;
  }

  private assertAccessible(module: Module, userId: string) {
    if (module.isPrivate && module.userId !== userId) {
      throw new ForbiddenException('Module is private');
    }
  }

  private async findModuleOrFail(moduleId: string): Promise<Module> {
    const module = await this.moduleRepository.findOne({
      where: { id: moduleId },
    });
    if (!module) {
      throw new NotFoundException('Module not found');
    }
    return module;
  }

  private async buildModulesForUserBatch(
    modules: Module[],
    userId: string,
    includeTerms: boolean,
  ): Promise<ModuleResponseV2Dto[]> {
    if (!modules.length) return [];

    const moduleIds = modules.map((m) => m.id);
    const ownerIds = [...new Set(modules.map((m) => m.userId))];

    // Batch load all owners and user modules
    const [owners, userModules] = await Promise.all([
      this.userRepository.find({
        where: { id: In(ownerIds) },
        select: ['id', 'name', 'profilePicture'],
      }),
      this.userModuleRepository.find({
        where: { userId, moduleId: In(moduleIds) },
      }),
    ]);

    const ownerMap = new Map(owners.map((o) => [o.id, o]));
    const collectedModuleIds = new Set(userModules.map((um) => um.moduleId));

    // Build all modules
    return Promise.all(
      modules.map(async (module) => {
        const isOwner = module.userId === userId;
        const isCollected = isOwner || collectedModuleIds.has(module.id);
        const terms = module.terms || [];
        const owner = ownerMap.get(module.userId);

        if (isCollected && terms.length) {
          await this.ensureProgressRecords(
            userId,
            module.id,
            module.userId === userId,
          );
        }

        const progress = await this.calculateProgressForUser(
          userId,
          module.id,
          terms,
          isCollected,
        );

        const termsWithProgress = includeTerms
          ? await this.attachTermProgress(userId, module.id, terms, isCollected)
          : undefined;

        return plainToInstance(
          ModuleResponseV2Dto,
          {
            ...module,
            ownerName: owner?.name,
            ownerImg: owner?.profilePicture,
            isOwner,
            isCollected,
            termsCount: terms.length,
            progress,
            terms: termsWithProgress,
          },
          { excludeExtraneousValues: true },
        );
      }),
    );
  }
}
