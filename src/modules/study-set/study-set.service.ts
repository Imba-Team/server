/**
 * Handles study set CRUD, collection membership, and user progress shaping.
 */

import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { In, Repository } from 'typeorm';

// Entities and enums
import { LoggerService } from 'src/common/logger/logger.service';
import { slugify } from 'src/common/utils/sligify';
import { StudySetVisibility } from 'src/infrastructure/persistence/enums';
import { FavoriteStudySet } from 'src/infrastructure/persistence/entities/favorite-study-set.entity';
import { Flashcard } from 'src/infrastructure/persistence/entities/flashcard.entity';
import { StudySet } from 'src/infrastructure/persistence/entities/study-set.entity';
import { User } from 'src/infrastructure/persistence/entities/user.entity';
import { UsersService } from 'src/modules/users/user.service';

// DTOs
import { CreateStudySetDto } from './dtos/create-study-set.dto';
import { SearchStudySetsDto } from './dtos/search-study-sets.dto';
import { StudySetResponseDto } from './dtos/study-set-response.dto';
import { UpdateStudySetDto } from './dtos/update-study-set.dto';
import { UpdateVisibilityDto } from './dtos/update-visibility.dto';

@Injectable()
export class StudySetService {
  constructor(
    private readonly logger: LoggerService,
    @InjectRepository(StudySet)
    private readonly studySetRepository: Repository<StudySet>,
    @InjectRepository(FavoriteStudySet)
    private readonly favoriteStudySetRepository: Repository<FavoriteStudySet>,
    @InjectRepository(Flashcard)
    private readonly flashcardRepository: Repository<Flashcard>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly usersService: UsersService,
  ) {
    this.logger.setContext(StudySetService.name);
  }

  // Section: Study set lifecycle operations

  async create(userId: string, dto: CreateStudySetDto) {
    this.logger.debug(`Creating study set for user: ${userId}`);

    //Check the user existence
    await this.usersService.findById(userId);

    const slug = slugify(dto.title);
    const duplicate = await this.studySetRepository.findOne({
      where: [{ slug }, { title: dto.title }],
    });

    // If a duplicate exists, determine if it's a slug or title conflict for better logging and error messages
    if (duplicate) {
      if (duplicate.slug === slug) {
        this.logger.warn(
          `Duplicate study set slug attempt: slug=${slug}, userId=${userId}`,
        );
        throw new ConflictException('Study set slug already exists');
      }
      this.logger.warn(
        `Duplicate study set title attempt: title="${dto.title}", userId=${userId}`,
      );
      throw new ConflictException('Study set title already exists');
    }

    const saved = await this.studySetRepository.save(
      this.studySetRepository.create({
        slug,
        title: dto.title,
        description: dto.description,
        language: dto.language,
        visibility:
          dto.isPrivate === true
            ? StudySetVisibility.PRIVATE
            : StudySetVisibility.PUBLIC,
        userId,
      }),
    );

    this.logger.log(`Study set created: id=${saved.id}, userId=${userId}`);

    return this.buildStudySetForUser(saved.id, userId);
  }

  async update(userId: string, studySetId: string, dto: UpdateStudySetDto) {
    this.logger.debug(`Updating study set: id=${studySetId}, userId=${userId}`);
    await this.ensureOwnedStudySet(userId, studySetId);
    const patch: Partial<StudySet> = {};
    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.language !== undefined) patch.language = dto.language;
    if (dto.isPrivate !== undefined) {
      patch.visibility = dto.isPrivate
        ? StudySetVisibility.PRIVATE
        : StudySetVisibility.PUBLIC;
    }
    if (Object.keys(patch).length) {
      await this.studySetRepository.update(studySetId, patch);
      this.logger.log(`Study set updated: id=${studySetId}, userId=${userId}`);
    }
    return this.buildStudySetForUser(studySetId, userId);
  }

  async updateVisibility(
    userId: string,
    studySetId: string,
    visibilityDto: UpdateVisibilityDto,
  ) {
    this.logger.debug(
      `Updating study set visibility: id=${studySetId}, userId=${userId}`,
    );
    await this.ensureOwnedStudySet(userId, studySetId);
    await this.studySetRepository.update(studySetId, {
      visibility: visibilityDto.isPrivate
        ? StudySetVisibility.PRIVATE
        : StudySetVisibility.PUBLIC,
    });
    this.logger.log(
      `Study set visibility updated: id=${studySetId}, private=${visibilityDto.isPrivate}`,
    );

    return this.buildStudySetForUser(studySetId, userId);
  }

  // Section: Study set listing and discovery

  async findCreatedStudySets(userId: string) {
    this.logger.debug(`Listing created study sets for user: ${userId}`);
    const sets = await this.studySetRepository.find({
      where: { userId },
      relations: ['flashcards'],
    });
    const sorted = sets.map((s) => this.withSortedFlashcards(s));
    return this.buildStudySetsForUserBatch(sorted, userId);
  }

  async findCollection(userId: string) {
    this.logger.debug(`Listing collection study sets for user: ${userId}`);
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

    return this.buildStudySetsForUserBatch([...byId.values()], userId);
  }

  async searchPublic(userId: string, query: SearchStudySetsDto) {
    this.logger.debug(
      `Searching public study sets for user: ${userId}, query="${query.q ?? ''}"`,
    );
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
    return this.buildStudySetsForUserBatch(sorted, userId);
  }

  // Section: Collection membership operations

  async addToCollection(userId: string, studySetId: string) {
    this.logger.debug(
      `Adding study set to collection: studySetId=${studySetId}, userId=${userId}`,
    );
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
        this.logger.log(
          `Study set collected: studySetId=${studySetId}, userId=${userId}`,
        );
      }
    }
    return this.buildStudySetForUser(studySetId, userId);
  }

  async removeFromCollection(userId: string, studySetId: string) {
    this.logger.debug(
      `Removing study set from collection: studySetId=${studySetId}, userId=${userId}`,
    );
    const studySet = await this.findStudySetOrFail(studySetId);
    this.assertAccessible(studySet, userId);

    if (studySet.userId === userId) {
      this.logger.warn(
        `Owner attempted to uncollect own study set: studySetId=${studySetId}, userId=${userId}`,
      );
      throw new ForbiddenException(
        'Cannot remove your own study set from collection',
      );
    }

    await this.favoriteStudySetRepository.delete({ userId, studySetId });
    this.logger.log(
      `Study set uncollected: studySetId=${studySetId}, userId=${userId}`,
    );

    return this.buildStudySetForUser(studySetId, userId, false);
  }

  // Section: Single study set retrieval

  async getById(userId: string, studySetId: string) {
    this.logger.debug(
      `Getting study set by id: studySetId=${studySetId}, userId=${userId}`,
    );
    const studySet = await this.studySetRepository.findOne({
      where: { id: studySetId },
      relations: ['flashcards'],
    });

    if (!studySet) {
      throw new NotFoundException('Study set not found');
    }

    this.assertAccessible(studySet, userId);

    const sorted = this.withSortedFlashcards(studySet);
    const isOwner = sorted.userId === userId;
    const isCollected =
      isOwner ||
      (await this.favoriteStudySetRepository.exist({
        where: { userId, studySetId },
      }));

    return this.buildStudySetForUser(sorted, userId, isCollected);
  }

  // Section: Mapping helpers

  private withSortedFlashcards(studySet: StudySet): StudySet {
    if (studySet.flashcards?.length) {
      studySet.flashcards.sort((a, b) => a.orderIndex - b.orderIndex);
    }
    return studySet;
  }

  private async buildStudySetForUser(
    studySetOrId: StudySet | string,
    userId: string,
    alreadyCollected?: boolean,
  ): Promise<StudySetResponseDto> {
    const studySet =
      typeof studySetOrId === 'string'
        ? await this.studySetRepository.findOne({
            where: { id: studySetOrId },
            relations: ['flashcards'],
          })
        : studySetOrId;

    if (!studySet) {
      throw new NotFoundException('Study set not found');
    }

    this.withSortedFlashcards(studySet);

    const ownerUserId = studySet.userId;
    const isOwner = ownerUserId === userId;
    const isCollected = alreadyCollected ?? isOwner;
    const flashcards = studySet.flashcards || [];

    const owner = await this.userRepository.findOne({
      where: { id: ownerUserId },
      select: ['id', 'username', 'legacyName', 'profilePicture'],
    });

    return plainToInstance(
      StudySetResponseDto,
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
        flashcardsCount: flashcards.length,
      },
      { excludeExtraneousValues: true },
    );
  }

  private async ensureOwnedStudySet(userId: string, studySetId: string) {
    const studySet = await this.findStudySetOrFail(studySetId);
    if (studySet.userId !== userId) {
      this.logger.warn(
        `Forbidden update attempt on non-owned study set: studySetId=${studySetId}, userId=${userId}`,
      );
      throw new ForbiddenException('You can only modify your own study sets');
    }
    return studySet;
  }

  private assertAccessible(studySet: StudySet, userId: string) {
    if (studySet.visibility !== StudySetVisibility.PRIVATE) return;
    if (studySet.userId === userId) return;
    this.logger.warn(
      `Private study set access denied: studySetId=${studySet.id}, userId=${userId}`,
    );
    throw new ForbiddenException('Study set is private');
  }

  private async findStudySetOrFail(studySetId: string): Promise<StudySet> {
    const studySet = await this.studySetRepository.findOne({
      where: { id: studySetId },
    });
    if (!studySet) {
      this.logger.warn(`Study set not found: studySetId=${studySetId}`);
      throw new NotFoundException('Study set not found');
    }
    return studySet;
  }

  // Section: Batch response builders

  private async buildStudySetsForUserBatch(
    studySets: StudySet[],
    userId: string,
  ): Promise<StudySetResponseDto[]> {
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
      studySets.map((studySet) => {
        this.withSortedFlashcards(studySet);
        const ownerUserId = studySet.userId;
        const isOwner = ownerUserId === userId;
        const isCollected = isOwner || favoritedIds.has(studySet.id);
        const flashcards = studySet.flashcards || [];
        const owner = ownerMap.get(ownerUserId);

        return plainToInstance(
          StudySetResponseDto,
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
            flashcardsCount: flashcards.length,
          },
          { excludeExtraneousValues: true },
        );
      }),
    );
  }
}
