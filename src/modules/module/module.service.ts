import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { LoggerService } from 'src/common/logger/logger.service';
import { Module } from 'src/infrastructure/persistence/entities/module.entity';
import { User } from 'src/infrastructure/persistence/entities/user.entity';
import { UsersService } from 'src/modules/users/user.service';
import { CreateModuleDto } from './dtos/create-module.dto';
import { UpdateModuleDto } from './dtos/update-module.dto';
import { UpdateVisibilityDto } from './dtos/update-visibility.dto';
import { slugify } from 'src/common/utils/sligify';
import { UserModule } from 'src/infrastructure/persistence/entities/user-module.entity';
import { Term } from 'src/infrastructure/persistence/entities/term.entity';
import { UserTermProgress } from 'src/infrastructure/persistence/entities/user-term-progress.entity';
import { SearchModulesDto } from './dtos/search-modules.dto';
import { plainToInstance } from 'class-transformer';
import { ModuleResponseDto } from './dtos/module-response.dto';
import { TermWithProgressDto } from 'src/modules/term/dtos/term-with-progress.dto';

@Injectable()
export class ModuleService {
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

  async create(userId: string, dto: CreateModuleDto) {
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
    });

    const saved = await this.moduleRepository.save(newModule);

    await this.userModuleRepository.save(
      this.userModuleRepository.create({
        userId,
        moduleId: saved.id,
        relation: 'owner',
      }),
    );
    await this.ensureProgressRecords(userId, saved.id, true);

    return this.buildModuleForUser(saved.id, userId, true, true);
  }

  async update(userId: string, moduleId: string, dto: UpdateModuleDto) {
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
    const links = await this.userModuleRepository.find({
      where: { userId, relation: 'owner' },
      relations: ['module', 'module.terms'],
    });
    const modules = links.map((l) => l.module).filter((m): m is Module => !!m);
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
    await this.assertAccessible(module, userId);

    const exists = await this.userModuleRepository.exist({
      where: { userId, moduleId },
    });
    if (!exists) {
      await this.userModuleRepository.save(
        this.userModuleRepository.create({
          userId,
          moduleId,
          relation: 'collected',
        }),
      );
    }
    await this.ensureProgressRecords(userId, moduleId, false);

    return this.buildModuleForUser(moduleId, userId, true);
  }

  async removeFromCollection(userId: string, moduleId: string) {
    const module = await this.findModuleOrFail(moduleId);
    await this.assertAccessible(module, userId);

    const link = await this.userModuleRepository.findOne({
      where: { userId, moduleId },
    });
    if (!link || link.relation === 'owner') {
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

    await this.assertAccessible(module, userId);

    const isOwner = await this.isModuleOwner(userId, moduleId);
    const isCollected =
      isOwner ||
      (await this.userModuleRepository.exist({
        where: { userId, moduleId },
      }));

    if (isCollected) {
      await this.ensureProgressRecords(userId, module.id, isOwner);
    }

    return this.buildModuleForUser(module, userId, true, isCollected);
  }

  private async buildModuleForUser(
    moduleOrId: Module | string,
    userId: string,
    includeTerms = false,
    alreadyCollected?: boolean,
  ): Promise<ModuleResponseDto> {
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

    const ownerUserId = await this.getOwnerUserId(module.id);
    if (!ownerUserId) {
      throw new NotFoundException('Module has no owner');
    }

    const isOwner = ownerUserId === userId;
    const isCollected = alreadyCollected ?? isOwner;
    const terms = module.terms || [];

    if (isCollected && terms.length) {
      await this.ensureProgressRecords(
        userId,
        module.id,
        ownerUserId === userId,
      );
    }

    const [progress, owner] = await Promise.all([
      this.calculateProgressForUser(userId, module.id, terms, isCollected),
      this.userRepository.findOne({
        where: { id: ownerUserId },
        select: ['id', 'name', 'profilePicture'],
      }),
    ]);

    const termsWithProgress = includeTerms
      ? await this.attachTermProgress(userId, module.id, terms, isCollected)
      : undefined;

    return plainToInstance(
      ModuleResponseDto,
      {
        ...module,
        userId: ownerUserId,
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
          status: seedFromExistingStatus ? 'not_started' : 'not_started',
          isStarred: false,
        }),
      );

    if (missing.length) {
      await this.userTermProgressRepository.save(missing);
    }
  }

  private async ensureOwnedModule(userId: string, moduleId: string) {
    const module = await this.findModuleOrFail(moduleId);
    if (!(await this.isModuleOwner(userId, moduleId))) {
      throw new ForbiddenException('You can only modify your own modules');
    }
    return module;
  }

  private async assertAccessible(module: Module, userId: string) {
    if (!module.isPrivate) return;
    if (await this.isModuleOwner(userId, module.id)) return;
    throw new ForbiddenException('Module is private');
  }

  private async getOwnerUserId(moduleId: string): Promise<string | undefined> {
    const row = await this.userModuleRepository.findOne({
      where: { moduleId, relation: 'owner' },
    });
    return row?.userId;
  }

  private async isModuleOwner(
    userId: string,
    moduleId: string,
  ): Promise<boolean> {
    return this.userModuleRepository.exist({
      where: { userId, moduleId, relation: 'owner' },
    });
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
  ): Promise<ModuleResponseDto[]> {
    if (!modules.length) return [];

    const moduleIds = modules.map((m) => m.id);

    const [ownerLinks, userModules] = await Promise.all([
      this.userModuleRepository.find({
        where: { moduleId: In(moduleIds), relation: 'owner' },
      }),
      this.userModuleRepository.find({
        where: { userId, moduleId: In(moduleIds) },
      }),
    ]);

    const ownerIdByModuleId = new Map(
      ownerLinks.map((l) => [l.moduleId, l.userId] as const),
    );
    const ownerIds = [...new Set(ownerLinks.map((l) => l.userId))];

    const ownerUsers = ownerIds.length
      ? await this.userRepository.find({
          where: { id: In(ownerIds) },
          select: ['id', 'name', 'profilePicture'],
        })
      : [];

    const ownerMap = new Map(ownerUsers.map((o) => [o.id, o]));
    const collectedModuleIds = new Set(userModules.map((um) => um.moduleId));

    return Promise.all(
      modules.map(async (module) => {
        const ownerUserId = ownerIdByModuleId.get(module.id);
        const isOwner = ownerUserId === userId;
        const isCollected = isOwner || collectedModuleIds.has(module.id);
        const terms = module.terms || [];
        const owner = ownerUserId ? ownerMap.get(ownerUserId) : undefined;

        if (isCollected && terms.length && ownerUserId !== undefined) {
          await this.ensureProgressRecords(
            userId,
            module.id,
            ownerUserId === userId,
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
          ModuleResponseDto,
          {
            ...module,
            userId: ownerUserId,
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
