import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { LoggerService } from 'src/common/logger/logger.service';
import { StudySetVisibility } from 'src/infrastructure/persistence/enums';
import { StudySetService } from 'src/modules/study-set/study-set.service';

import { FavouriteStudySet } from './favourite-study-set.entity';

@Injectable()
export class FavouriteStudySetService {
  constructor(
    private readonly logger: LoggerService,
    private readonly studySetService: StudySetService,
    @InjectRepository(FavouriteStudySet)
    private readonly favouriteStudySetRepository: Repository<FavouriteStudySet>,
  ) {
    this.logger.setContext(FavouriteStudySetService.name);
  }

  async addToLibrary(currentUserId: string, studySetId: string) {
    const studySet = await this.studySetService.findByIdOrFail(studySetId);

    if (studySet.userId === currentUserId) {
      throw new BadRequestException(
        'You cannot save your own study set to your library',
      );
    }

    if (studySet.visibility !== StudySetVisibility.PUBLIC) {
      throw new ForbiddenException('Only public study sets can be saved');
    }

    const existing = await this.favouriteStudySetRepository.findOne({
      where: {
        userId: currentUserId,
        studySetId,
      },
    });

    if (existing) {
      throw new ConflictException('Study set is already saved in your library');
    }

    const created = this.favouriteStudySetRepository.create({
      userId: currentUserId,
      studySetId,
    });

    return this.favouriteStudySetRepository.save(created);
  }

  async removeFromLibrary(
    currentUserId: string,
    studySetId: string,
  ): Promise<void> {
    const studySet = await this.studySetService.findByIdOrFail(studySetId);

    if (studySet.userId === currentUserId) {
      throw new ForbiddenException(
        'You cannot unsave your own study set from library',
      );
    }

    await this.favouriteStudySetRepository.delete({
      userId: currentUserId,
      studySetId,
    });
  }
}
