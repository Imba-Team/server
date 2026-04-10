import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { LoggerService } from 'src/common/logger/logger.service';
import { StudySet } from 'src/infrastructure/persistence/entities/study-set.entity';
import { User } from 'src/infrastructure/persistence/entities/user.entity';
import { UsersService } from 'src/modules/users/user.service';
import { CreateModuleDto } from './dtos/create-module.dto';
import { UpdateModuleDto } from './dtos/update-module.dto';
import { UpdateVisibilityDto } from './dtos/update-visibility.dto';
import { slugify } from 'src/common/utils/sligify';
import { FavoriteStudySet } from 'src/infrastructure/persistence/entities/favorite-study-set.entity';
import { Flashcard } from 'src/infrastructure/persistence/entities/flashcard.entity';
import { FlashcardUserState } from 'src/infrastructure/persistence/entities/flashcard-user-state.entity';
import { SearchModulesDto } from './dtos/search-modules.dto';
import { plainToInstance } from 'class-transformer';
import { ModuleResponseDto } from './dtos/module-response.dto';
import { TermWithProgressDto } from 'src/modules/term/dtos/term-with-progress.dto';
import { StudySetVisibility } from 'src/infrastructure/persistence/enums';
import { confidenceToStatus } from 'src/infrastructure/persistence/flashcard-user-state.mapper';

@Injectable()
export class ModuleService {
  constructor(
    private readonly logger: LoggerService,
    @InjectRepository(StudySet)
    private readonly studySetRepository: Repository<StudySet>,
    @InjectRepository(FavoriteStudySet)
    private readonly favoriteStudySetRepository: Repository<FavoriteStudySet>,
    @InjectRepository(FlashcardUserState)
    private readonly flashcardUserStateRepository: Repository<FlashcardUserState>,
    @InjectRepository(Flashcard)
    private readonly flashcardRepository: Repository<Flashcard>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly usersService: UsersService,
  ) {}

  async create(userId: string, dto: CreateModuleDto) {
    await this.usersService.findById(userId);

    const slug = slugify(dto.title);

    const duplicate = await this.studySetRepository.findOne({
      where: [{ slug }, { title: dto.title }],
    });

    if (duplicate) {
      if (duplicate.slug === slug) {
        throw new ConflictException('Module slug already exists');
      }
      throw new ConflictException('Module title already exists');
    }

    const saved = await this.studySetRepository.save(
      this.studySetRepository.create({
        slug,
        title: dto.title,
        description: dto.description ?? null,
        visibility:
          dto.isPrivate === true
            ? StudySetVisibility.PRIVATE
            : StudySetVisibility.PUBLIC,
        userId,
      }),
    );

    await this.ensureProgressRecords(userId, saved.id);

    return this.buildModuleForUser(saved.id, userId, true, true);
  }

  async update(userId: string, studySetId: string, dto: UpdateModuleDto) {
    await this.ensureOwnedStudySet(userId, studySetId);
    const patch: Partial<StudySet> = {};
    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.isPrivate !== undefined) {
      patch.visibility = dto.isPrivate
        ? StudySetVisibility.PRIVATE
        : StudySetVisibility.PUBLIC;
    }
    if (Object.keys(patch).length) {
      await this.studySetRepository.update(studySetId, patch);
    }
    return this.buildModuleForUser(studySetId, userId, true);
  }

  async updateVisibility(
    userId: string,
    studySetId: string,
    visibilityDto: UpdateVisibilityDto,
  ) {
    await this.ensureOwnedStudySet(userId, studySetId);
    await this.studySetRepository.update(studySetId, {
      visibility: visibilityDto.isPrivate
        ? StudySetVisibility.PRIVATE
        : StudySetVisibility.PUBLIC,
    });

    return this.buildModuleForUser(studySetId, userId, true);
  }

  async findCreatedModules(userId: string) {
    const sets = await this.studySetRepository.find({
      where: { userId },
      relations: ['flashcards'],
    });
    const sorted = sets.map((s) => this.withSortedFlashcards(s));
    return this.buildModulesForUserBatch(sorted, userId, false);
  }

  async findCollection(userId: string) {
    const owned = await this.studySetRepository.find({
      where: { userId },
      relations: ['flashcards'],
    });
    const favLinks = await this.favoriteStudySetRepository.find({
      where: { userId },
      relations: ['studySet', 'studySet.flashcards'],
    });

    const byId = new Map<string, StudySet>();
    for (const s of owned) {
      byId.set(s.id, this.withSortedFlashcards(s));
    }
    for (const link of favLinks) {
      if (link.studySet && !byId.has(link.studySet.id)) {
        byId.set(link.studySet.id, this.withSortedFlashcards(link.studySet));
      }
    }

    return this.buildModulesForUserBatch([...byId.values()], userId, false);
  }

  async searchPublic(userId: string, query: SearchModulesDto) {
    const qb = this.studySetRepository
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.flashcards', 'f')
      .where('s.visibility = :vis', { vis: StudySetVisibility.PUBLIC })
      .orderBy('f.orderIndex', 'ASC');

    if (query.q) {
      qb.andWhere(
        '(LOWER(s.title) LIKE LOWER(:search) OR LOWER(s.description) LIKE LOWER(:search))',
        {
          search: `%${query.q}%`,
        },
      );
    }

    const sets = await qb.getMany();
    const sorted = sets.map((s) => this.withSortedFlashcards(s));
    return this.buildModulesForUserBatch(sorted, userId, false);
  }

  async addToCollection(userId: string, studySetId: string) {
    const studySet = await this.findStudySetOrFail(studySetId);
    this.assertAccessible(studySet, userId);

    if (studySet.userId !== userId) {
      const exists = await this.favoriteStudySetRepository.exist({
        where: { userId, studySetId },
      });
      if (!exists) {
        await this.favoriteStudySetRepository.save(
          this.favoriteStudySetRepository.create({ userId, studySetId }),
        );
      }
    }
    await this.ensureProgressRecords(userId, studySetId);

    return this.buildModuleForUser(studySetId, userId, true);
  }

  async removeFromCollection(userId: string, studySetId: string) {
    const studySet = await this.findStudySetOrFail(studySetId);
    this.assertAccessible(studySet, userId);

    if (studySet.userId === userId) {
      throw new ForbiddenException(
        'Cannot remove your own module from collection',
      );
    }

    await this.favoriteStudySetRepository.delete({ userId, studySetId });

    return this.buildModuleForUser(studySetId, userId, true, false);
  }

  async getById(userId: string, studySetId: string) {
    const studySet = await this.studySetRepository.findOne({
      where: { id: studySetId },
      relations: ['flashcards'],
    });

    if (!studySet) {
      throw new NotFoundException('Module not found');
    }

    this.assertAccessible(studySet, userId);

    const sorted = this.withSortedFlashcards(studySet);
    const isOwner = sorted.userId === userId;
    const isCollected =
      isOwner ||
      (await this.favoriteStudySetRepository.exist({
        where: { userId, studySetId },
      }));

    if (isCollected) {
      await this.ensureProgressRecords(userId, sorted.id);
    }

    return this.buildModuleForUser(sorted, userId, true, isCollected);
  }

  private withSortedFlashcards(studySet: StudySet): StudySet {
    if (studySet.flashcards?.length) {
      studySet.flashcards.sort((a, b) => a.orderIndex - b.orderIndex);
    }
    return studySet;
  }

  private async buildModuleForUser(
    studySetOrId: StudySet | string,
    userId: string,
    includeTerms = false,
    alreadyCollected?: boolean,
  ): Promise<ModuleResponseDto> {
    const studySet =
      typeof studySetOrId === 'string'
        ? await this.studySetRepository.findOne({
            where: { id: studySetOrId },
            relations: ['flashcards'],
          })
        : studySetOrId;

    if (!studySet) {
      throw new NotFoundException('Module not found');
    }

    this.withSortedFlashcards(studySet);

    const ownerUserId = studySet.userId;
    const isOwner = ownerUserId === userId;
    const isCollected = alreadyCollected ?? isOwner;
    const terms = studySet.flashcards || [];

    if (isCollected && terms.length) {
      await this.ensureProgressRecords(userId, studySet.id);
    }

    const [progress, owner] = await Promise.all([
      this.calculateProgressForUser(userId, studySet.id, terms, isCollected),
      this.userRepository.findOne({
        where: { id: ownerUserId },
        select: ['id', 'username', 'legacyName', 'profilePicture'],
      }),
    ]);

    const termsWithProgress = includeTerms
      ? await this.attachTermProgress(userId, studySet.id, terms, isCollected)
      : undefined;

    return plainToInstance(
      ModuleResponseDto,
      {
        id: studySet.id,
        slug: studySet.slug,
        title: studySet.title,
        description: studySet.description ?? '',
        isPrivate: studySet.visibility === StudySetVisibility.PRIVATE,
        userId: ownerUserId,
        ownerName: owner?.username ?? owner?.legacyName ?? undefined,
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
    studySetId: string,
    flashcards: Flashcard[],
    isCollected: boolean,
  ): Promise<TermWithProgressDto[]> {
    if (!flashcards.length) return [];

    if (!isCollected) {
      return flashcards.map((card) =>
        plainToInstance(
          TermWithProgressDto,
          {
            id: card.id,
            term: card.term,
            definition: card.definition,
            status: 'not_started',
            isStarred: false,
          },
          { excludeExtraneousValues: true },
        ),
      );
    }

    const cardIds = flashcards.map((t) => t.id);
    const progressRows = await this.flashcardUserStateRepository.find({
      where: { userId, flashcardId: In(cardIds) },
    });

    const progressMap = new Map(progressRows.map((p) => [p.flashcardId, p]));

    return flashcards.map((card) => {
      const row = progressMap.get(card.id);
      return plainToInstance(
        TermWithProgressDto,
        {
          id: card.id,
          term: card.term,
          definition: card.definition,
          status: confidenceToStatus(row ?? null),
          isStarred: row?.isStarred ?? false,
        },
        { excludeExtraneousValues: true },
      );
    });
  }

  private async calculateProgressForUser(
    userId: string,
    studySetId: string,
    flashcards: Flashcard[],
    isCollected: boolean,
  ): Promise<{ not_started: number; in_progress: number; completed: number }> {
    const defaultProgress = {
      not_started: flashcards.length ? 1 : 0,
      in_progress: 0,
      completed: 0,
    };

    if (!isCollected || !flashcards.length) {
      return defaultProgress;
    }

    const cardIds = flashcards.map((t) => t.id);
    const progressRows = await this.flashcardUserStateRepository.find({
      where: { userId, flashcardId: In(cardIds) },
    });

    if (!progressRows.length) {
      return defaultProgress;
    }

    const counts = progressRows.reduce(
      (acc, row) => {
        acc[confidenceToStatus(row)]++;
        return acc;
      },
      { not_started: 0, in_progress: 0, completed: 0 },
    );

    const total = flashcards.length;

    return {
      not_started: counts.not_started / total,
      in_progress: counts.in_progress / total,
      completed: counts.completed / total,
    };
  }

  private async ensureProgressRecords(userId: string, studySetId: string) {
    const cards = await this.flashcardRepository.find({
      where: { studySetId },
    });
    if (!cards.length) return;

    const cardIds = cards.map((t) => t.id);
    const existing = await this.flashcardUserStateRepository.find({
      where: { userId, flashcardId: In(cardIds) },
    });

    const existingMap = new Set(existing.map((e) => e.flashcardId));

    const toCreate = cards
      .filter((t) => !existingMap.has(t.id))
      .map((card) =>
        this.flashcardUserStateRepository.create({
          userId,
          flashcardId: card.id,
        }),
      );

    if (toCreate.length) {
      await this.flashcardUserStateRepository.save(toCreate);
    }
  }

  private async ensureOwnedStudySet(userId: string, studySetId: string) {
    const studySet = await this.findStudySetOrFail(studySetId);
    if (studySet.userId !== userId) {
      throw new ForbiddenException('You can only modify your own modules');
    }
    return studySet;
  }

  private assertAccessible(studySet: StudySet, userId: string) {
    if (studySet.visibility !== StudySetVisibility.PRIVATE) return;
    if (studySet.userId === userId) return;
    throw new ForbiddenException('Module is private');
  }

  private async findStudySetOrFail(studySetId: string): Promise<StudySet> {
    const studySet = await this.studySetRepository.findOne({
      where: { id: studySetId },
    });
    if (!studySet) {
      throw new NotFoundException('Module not found');
    }
    return studySet;
  }

  private async buildModulesForUserBatch(
    studySets: StudySet[],
    userId: string,
    includeTerms: boolean,
  ): Promise<ModuleResponseDto[]> {
    if (!studySets.length) return [];

    const studySetIds = studySets.map((m) => m.id);
    const ownerIds = [...new Set(studySets.map((m) => m.userId))];

    const [ownerUsers, favoriteLinks] = await Promise.all([
      ownerIds.length
        ? this.userRepository.find({
            where: { id: In(ownerIds) },
            select: ['id', 'username', 'legacyName', 'profilePicture'],
          })
        : Promise.resolve([] as User[]),
      this.favoriteStudySetRepository.find({
        where: { userId, studySetId: In(studySetIds) },
      }),
    ]);

    const ownerMap = new Map(ownerUsers.map((o) => [o.id, o]));
    const favoritedIds = new Set(favoriteLinks.map((f) => f.studySetId));

    return Promise.all(
      studySets.map(async (studySet) => {
        this.withSortedFlashcards(studySet);
        const ownerUserId = studySet.userId;
        const isOwner = ownerUserId === userId;
        const isCollected = isOwner || favoritedIds.has(studySet.id);
        const terms = studySet.flashcards || [];
        const owner = ownerMap.get(ownerUserId);

        if (isCollected && terms.length) {
          await this.ensureProgressRecords(userId, studySet.id);
        }

        const progress = await this.calculateProgressForUser(
          userId,
          studySet.id,
          terms,
          isCollected,
        );

        const termsWithProgress = includeTerms
          ? await this.attachTermProgress(
              userId,
              studySet.id,
              terms,
              isCollected,
            )
          : undefined;

        return plainToInstance(
          ModuleResponseDto,
          {
            id: studySet.id,
            slug: studySet.slug,
            title: studySet.title,
            description: studySet.description ?? '',
            isPrivate: studySet.visibility === StudySetVisibility.PRIVATE,
            userId: ownerUserId,
            ownerName: owner?.username ?? owner?.legacyName ?? undefined,
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
