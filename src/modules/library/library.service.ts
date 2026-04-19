import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';

import { LoggerService } from 'src/common/logger/logger.service';
import { StudySet } from 'src/infrastructure/persistence/entities/study-set.entity';
import { FavouriteStudySet } from 'src/modules/favourite-study-set/favourite-study-set.entity';

import { LibraryItemDto } from './dto/library-item.dto';

@Injectable()
export class LibraryService {
  constructor(
    private readonly logger: LoggerService,
    @InjectRepository(StudySet)
    private readonly studySetRepository: Repository<StudySet>,
    @InjectRepository(FavouriteStudySet)
    private readonly favouriteStudySetRepository: Repository<FavouriteStudySet>,
  ) {
    this.logger.setContext(LibraryService.name);
  }

  async getLibrary(currentUserId: string): Promise<LibraryItemDto[]> {
    this.logger.debug(`Loading library for user: ${currentUserId}`);

    const queryBuilder = this.studySetRepository
      .createQueryBuilder('s')
      .leftJoin(
        FavouriteStudySet,
        'f',
        'f.studySetId = s.id AND f.userId = :currentUserId',
        { currentUserId },
      )
      .addSelect('s.userId = :currentUserId', 'isOwner')
      .addSelect('f.id IS NOT NULL', 'isFavourited')
      .where('s.userId = :currentUserId OR f.userId = :currentUserId', {
        currentUserId,
      })
      .orderBy('s.createdAt', 'DESC');

    const { entities, raw } = await queryBuilder.getRawAndEntities();

    return entities.map((studySet, index) =>
      plainToInstance(
        LibraryItemDto,
        {
          ...studySet,
          isOwner: this.toBoolean(raw[index]?.isOwner),
          isFavourited: this.toBoolean(raw[index]?.isFavourited),
        },
        { excludeExtraneousValues: true },
      ),
    );
  }

  private toBoolean(value: unknown): boolean {
    return value === true || value === 1 || value === '1';
  }
}
