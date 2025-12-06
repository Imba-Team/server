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
    const duplicateSlug = await this.moduleRepository.findOne({
      where: { slug },
    });
    if (duplicateSlug) {
      throw new ConflictException('Module slug already exists');
    }

    const duplicateTitle = await this.moduleRepository.findOne({
      where: { title: dto.title },
    });

    if (duplicateTitle) {
      throw new ConflictException('Module title already exists');
    }

    const newModule = this.moduleRepository.create({
      ...dto,
      slug,
      userId,
    });

    const saved = await this.moduleRepository.save(newModule);

    await this.ensureUserModule(userId, saved.id, true);

    return this.buildModuleForUser(saved.id, userId, true);
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

  async findMyModules(userId: string) {
    const modules = await this.moduleRepository.find({ where: { userId } });
    return Promise.all(
      modules.map((mod) => this.buildModuleForUser(mod.id, userId, false)),
    );
  }

  async findCollection(userId: string) {
    const links = await this.userModuleRepository.find({
      where: { userId },
      relations: ['module'],
    });

    return Promise.all(
      links.map((link) =>
        this.buildModuleForUser(link.moduleId, userId, false),
      ),
    );
  }

  async searchPublic(userId: string, query: SearchModulesDto) {
    const qb = this.moduleRepository
      .createQueryBuilder('m')
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

    return Promise.all(
      modules.map((mod) => this.buildModuleForUser(mod.id, userId, false)),
    );
  }

  async addToCollection(userId: string, moduleId: string) {
    const module = await this.findModuleOrFail(moduleId);
    this.assertAccessible(module, userId);

    await this.ensureUserModule(userId, moduleId, false);

    return this.buildModuleForUser(moduleId, userId, true);
  }

  async getById(userId: string, moduleId: string) {
    const module = await this.findModuleOrFail(moduleId);
    this.assertAccessible(module, userId);

    const isOwner = module.userId === userId;
    const isCollected = await this.userModuleRepository.exist({
      where: { userId, moduleId },
    });

    if (isOwner || isCollected) {
      await this.ensureUserModule(userId, moduleId, isOwner);
    }

    return this.buildModuleForUser(
      moduleId,
      userId,
      true,
      isOwner || isCollected,
    );
  }

  private async buildModuleForUser(
    moduleId: string,
    userId: string,
    includeTerms = false,
    alreadyCollected?: boolean,
  ): Promise<ModuleResponseV2Dto> {
    const module = await this.findModuleOrFail(moduleId);

    const owner = await this.userRepository.findOne({
      where: { id: module.userId },
    });

    const isCollected =
      alreadyCollected ||
      (await this.userModuleRepository.exist({
        where: { userId, moduleId },
      })) ||
      module.userId === userId;

    const shouldLoadTerms = includeTerms || isCollected;
    const terms = shouldLoadTerms
      ? await this.termRepository.find({ where: { moduleId: module.id } })
      : [];

    if (isCollected) {
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
        isCollected,
        termsCount: terms.length
          ? terms.length
          : (module.terms?.length ?? undefined),
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
  ) {
    if (!terms.length) return [] as TermWithProgressDto[];

    const termIds = terms.map((t) => t.id);
    let progressRows: UserTermProgress[] = [];

    if (isCollected) {
      progressRows = await this.userTermProgressRepository.find({
        where: { userId, termId: In(termIds) },
      });
    }

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
  ) {
    if (!isCollected || !terms.length) {
      return {
        not_started: terms.length ? 1 : 0,
        in_progress: 0,
        completed: 0,
      };
    }

    const termIds = terms.map((t) => t.id);
    const progressRows = await this.userTermProgressRepository.find({
      where: { userId, termId: In(termIds) },
    });

    if (!progressRows.length) {
      return {
        not_started: terms.length ? 1 : 0,
        in_progress: 0,
        completed: 0,
      };
    }

    const counts = {
      not_started: 0,
      in_progress: 0,
      completed: 0,
    };

    for (const row of progressRows) {
      counts[row.status]++;
    }

    const total = terms.length || 1;

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
  ) {
    const exists = await this.userModuleRepository.findOne({
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

  private async findModuleOrFail(moduleId: string) {
    const module = await this.moduleRepository.findOne({
      where: { id: moduleId },
    });
    if (!module) {
      throw new NotFoundException('Module not found');
    }
    return module;
  }
}
