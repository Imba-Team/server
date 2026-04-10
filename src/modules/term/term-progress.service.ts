import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { LoggerService } from 'src/common/logger/logger.service';
import { Flashcard } from 'src/infrastructure/persistence/entities/flashcard.entity';
import { StudySet } from 'src/infrastructure/persistence/entities/study-set.entity';
import { FavoriteStudySet } from 'src/infrastructure/persistence/entities/favorite-study-set.entity';
import { FlashcardUserState } from 'src/infrastructure/persistence/entities/flashcard-user-state.entity';
import { UpdateTermProgressDto } from './dtos/update-term-progress.dto';
import { plainToInstance } from 'class-transformer';
import { TermWithProgressDto } from './dtos/term-with-progress.dto';
import { StudySetVisibility } from 'src/infrastructure/persistence/enums';
import {
  confidenceToStatus,
  nextStatusAfterAnswer,
  statusToConfidence,
} from 'src/infrastructure/persistence/flashcard-user-state.mapper';

@Injectable()
export class TermProgressService {
  constructor(
    private readonly logger: LoggerService,
    @InjectRepository(Flashcard)
    private readonly flashcardRepository: Repository<Flashcard>,
    @InjectRepository(StudySet)
    private readonly studySetRepository: Repository<StudySet>,
    @InjectRepository(FavoriteStudySet)
    private readonly favoriteStudySetRepository: Repository<FavoriteStudySet>,
    @InjectRepository(FlashcardUserState)
    private readonly flashcardUserStateRepository: Repository<FlashcardUserState>,
  ) {}

  async updateProgress(
    userId: string,
    flashcardId: string,
    dto: UpdateTermProgressDto,
  ): Promise<TermWithProgressDto> {
    const flashcard = await this.flashcardRepository.findOne({
      where: { id: flashcardId },
    });
    if (!flashcard) {
      throw new NotFoundException('Term not found');
    }

    const studySet = await this.studySetRepository.findOne({
      where: { id: flashcard.studySetId },
    });

    if (!studySet) {
      throw new NotFoundException('Module not found');
    }

    const isOwner = await this.isStudySetOwner(userId, studySet.id);
    if (studySet.visibility === StudySetVisibility.PRIVATE && !isOwner) {
      throw new ForbiddenException('Module is private');
    }

    if (!isOwner) {
      const inCollection = await this.favoriteStudySetRepository.exist({
        where: { userId, studySetId: studySet.id },
      });

      if (!inCollection) {
        throw new ForbiddenException('Add the module to your collection first');
      }
    } else {
      await this.ensureProgressRecords(userId, studySet.id);
    }

    let state = await this.flashcardUserStateRepository.findOne({
      where: { userId, flashcardId },
    });

    if (!state) {
      state = this.flashcardUserStateRepository.create({
        userId,
        flashcardId,
      });
    }

    if (dto.status) {
      state.confidenceLevel = statusToConfidence(dto.status);
    }

    if (dto.isStarred !== undefined) {
      state.isStarred = dto.isStarred;
    }

    const saved = await this.flashcardUserStateRepository.save(state);

    return plainToInstance(
      TermWithProgressDto,
      {
        id: flashcard.id,
        term: flashcard.term,
        definition: flashcard.definition,
        status: confidenceToStatus(saved),
        isStarred: saved.isStarred,
      },
      { excludeExtraneousValues: true },
    );
  }

  async updateStatus(
    userId: string,
    flashcardId: string,
    success: boolean,
  ): Promise<TermWithProgressDto> {
    this.logger.log(
      `Attempting to ${success ? 'upgrade' : 'decrease'} status of term with ID: ${flashcardId}`,
    );

    const flashcard = await this.flashcardRepository.findOne({
      where: { id: flashcardId },
    });
    if (!flashcard) {
      this.logger.warn(
        `Term with ID ${flashcardId} not found for status update.`,
      );
      throw new NotFoundException('Term not found');
    }

    const studySet = await this.studySetRepository.findOne({
      where: { id: flashcard.studySetId },
    });

    if (!studySet) {
      this.logger.warn(`Module for term ID ${flashcardId} not found.`);
      throw new NotFoundException('Module not found');
    }

    const isOwner = await this.isStudySetOwner(userId, studySet.id);
    if (studySet.visibility === StudySetVisibility.PRIVATE && !isOwner) {
      this.logger.warn(
        `User ${userId} attempted to update status of term ${flashcardId} in private module ${studySet.id}`,
      );
      throw new ForbiddenException('Module is private');
    }

    if (!isOwner) {
      const inCollection = await this.favoriteStudySetRepository.exist({
        where: { userId, studySetId: studySet.id },
      });

      if (!inCollection) {
        this.logger.warn(
          `User ${userId} attempted to update status of term ${flashcardId} without having module ${studySet.id} in collection`,
        );
        throw new ForbiddenException('Add the module to your collection first');
      }
    } else {
      await this.ensureProgressRecords(userId, studySet.id);
    }

    let state = await this.flashcardUserStateRepository.findOne({
      where: { userId, flashcardId },
    });

    if (!state) {
      state = this.flashcardUserStateRepository.create({
        userId,
        flashcardId,
      });
    }

    const currentStatus = confidenceToStatus(state);
    const newStatus = nextStatusAfterAnswer(currentStatus, success);

    if (newStatus !== currentStatus) {
      state.confidenceLevel = statusToConfidence(newStatus);
      const saved = await this.flashcardUserStateRepository.save(state);
      this.logger.log(
        `Successfully ${success ? 'upgraded' : 'decreased'} status of term with ID: ${flashcardId} to ${newStatus}`,
      );
      return plainToInstance(
        TermWithProgressDto,
        {
          id: flashcard.id,
          term: flashcard.term,
          definition: flashcard.definition,
          status: confidenceToStatus(saved),
          isStarred: saved.isStarred,
        },
        { excludeExtraneousValues: true },
      );
    }

    return plainToInstance(
      TermWithProgressDto,
      {
        id: flashcard.id,
        term: flashcard.term,
        definition: flashcard.definition,
        status: confidenceToStatus(state),
        isStarred: state.isStarred,
      },
      { excludeExtraneousValues: true },
    );
  }

  async getProgress(
    userId: string,
    flashcardId: string,
  ): Promise<TermWithProgressDto> {
    const flashcard = await this.flashcardRepository.findOne({
      where: { id: flashcardId },
    });
    if (!flashcard) {
      throw new NotFoundException('Term not found');
    }

    const studySet = await this.studySetRepository.findOne({
      where: { id: flashcard.studySetId },
    });

    if (!studySet) {
      throw new NotFoundException('Module not found');
    }

    const isOwner = await this.isStudySetOwner(userId, studySet.id);
    if (studySet.visibility === StudySetVisibility.PRIVATE && !isOwner) {
      throw new ForbiddenException('Module is private');
    }

    const progressRow = await this.flashcardUserStateRepository.findOne({
      where: { userId, flashcardId },
    });

    const isCollected =
      isOwner ||
      (await this.favoriteStudySetRepository.exist({
        where: { userId, studySetId: studySet.id },
      }));

    if (isCollected && !progressRow) {
      await this.ensureProgressRecords(userId, studySet.id);
      return this.getProgress(userId, flashcardId);
    }

    return plainToInstance(
      TermWithProgressDto,
      {
        id: flashcard.id,
        term: flashcard.term,
        definition: flashcard.definition,
        status: confidenceToStatus(progressRow ?? null),
        isStarred: progressRow?.isStarred ?? false,
      },
      { excludeExtraneousValues: true },
    );
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

  private async isStudySetOwner(
    userId: string,
    studySetId: string,
  ): Promise<boolean> {
    const row = await this.studySetRepository.findOne({
      where: { id: studySetId },
      select: ['userId'],
    });
    return row?.userId === userId;
  }
}
