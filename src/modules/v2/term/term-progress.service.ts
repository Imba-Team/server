import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { LoggerService } from 'src/common/logger/logger.service';
import { Term } from '../../v1/terms/term.entity';
import { Module } from '../../v1/module/module.entity';
import { UserModule } from '../module/user-module.entity';
import { UserTermProgress } from './user-term-progress.entity';
import { UpdateTermProgressDto } from './dtos/update-term-progress.dto';
import { plainToInstance } from 'class-transformer';
import { TermWithProgressDto } from './dtos/term-with-progress.dto';

@Injectable()
export class TermProgressV2Service {
  constructor(
    private readonly logger: LoggerService,
    @InjectRepository(Term)
    private readonly termRepository: Repository<Term>,
    @InjectRepository(Module)
    private readonly moduleRepository: Repository<Module>,
    @InjectRepository(UserModule)
    private readonly userModuleRepository: Repository<UserModule>,
    @InjectRepository(UserTermProgress)
    private readonly userTermProgressRepository: Repository<UserTermProgress>,
  ) {}

  async updateProgress(
    userId: string,
    termId: string,
    dto: UpdateTermProgressDto,
  ): Promise<TermWithProgressDto> {
    const term = await this.termRepository.findOne({ where: { id: termId } });
    if (!term) {
      throw new NotFoundException('Term not found');
    }

    const module = await this.moduleRepository.findOne({
      where: { id: term.moduleId },
    });

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    const isOwner = module.userId === userId;
    if (module.isPrivate && !isOwner) {
      throw new ForbiddenException('Module is private');
    }

    if (!isOwner) {
      const inCollection = await this.userModuleRepository.exist({
        where: { userId, moduleId: module.id },
      });

      if (!inCollection) {
        throw new ForbiddenException('Add the module to your collection first');
      }
    } else {
      await this.ensureUserModule(userId, module.id, true);
    }

    let progress = await this.userTermProgressRepository.findOne({
      where: { userId, termId },
    });

    if (!progress) {
      progress = this.userTermProgressRepository.create({
        userId,
        termId,
        status: isOwner ? term.status : 'not_started',
        isStarred: isOwner ? term.isStarred : false,
      });
    }

    if (dto.status) {
      progress.status = dto.status;
    }

    if (dto.isStarred !== undefined) {
      progress.isStarred = dto.isStarred;
    }

    const saved = await this.userTermProgressRepository.save(progress);

    return plainToInstance(
      TermWithProgressDto,
      { ...term, status: saved.status, isStarred: saved.isStarred },
      { excludeExtraneousValues: true },
    );
  }

  async updateStatus(
    userId: string,
    termId: string,
    success: boolean,
  ): Promise<TermWithProgressDto> {
    this.logger.log(
      `Attempting to ${success ? 'upgrade' : 'decrease'} status of term with ID: ${termId}`,
    );

    const term = await this.termRepository.findOne({ where: { id: termId } });
    if (!term) {
      this.logger.warn(`Term with ID ${termId} not found for status update.`);
      throw new NotFoundException('Term not found');
    }

    const module = await this.moduleRepository.findOne({
      where: { id: term.moduleId },
    });

    if (!module) {
      this.logger.warn(`Module for term ID ${termId} not found.`);
      throw new NotFoundException('Module not found');
    }

    const isOwner = module.userId === userId;
    if (module.isPrivate && !isOwner) {
      this.logger.warn(
        `User ${userId} attempted to update status of term ${termId} in private module ${module.id}`,
      );
      throw new ForbiddenException('Module is private');
    }

    if (!isOwner) {
      const inCollection = await this.userModuleRepository.exist({
        where: { userId, moduleId: module.id },
      });

      if (!inCollection) {
        this.logger.warn(
          `User ${userId} attempted to update status of term ${termId} without having module ${module.id} in collection`,
        );
        throw new ForbiddenException('Add the module to your collection first');
      }
    } else {
      await this.ensureUserModule(userId, module.id, true);
    }

    let progress = await this.userTermProgressRepository.findOne({
      where: { userId, termId },
    });

    if (!progress) {
      progress = this.userTermProgressRepository.create({
        userId,
        termId,
        status: isOwner ? term.status : 'not_started',
        isStarred: isOwner ? term.isStarred : false,
      });
    }

    const currentStatus = progress.status;
    let newStatus = currentStatus;

    // Upgrade rules (success === true):
    // not_started -> in_progress
    // in_progress -> completed
    if (success) {
      if (currentStatus === 'not_started') {
        newStatus = 'in_progress';
      } else if (currentStatus === 'in_progress') {
        newStatus = 'completed';
      }
    } else {
      // Decrease rules (success === false):
      // completed -> in_progress
      // in_progress -> not_started
      if (currentStatus === 'completed') {
        newStatus = 'in_progress';
      } else if (currentStatus === 'in_progress') {
        newStatus = 'not_started';
      }
    }

    if (newStatus !== currentStatus) {
      progress.status = newStatus;
      const saved = await this.userTermProgressRepository.save(progress);
      this.logger.log(
        `Successfully ${success ? 'upgraded' : 'decreased'} status of term with ID: ${termId} to ${newStatus}`,
      );
      return plainToInstance(
        TermWithProgressDto,
        { ...term, status: saved.status, isStarred: saved.isStarred },
        { excludeExtraneousValues: true },
      );
    }

    return plainToInstance(
      TermWithProgressDto,
      { ...term, status: progress.status, isStarred: progress.isStarred },
      { excludeExtraneousValues: true },
    );
  }

  async getProgress(
    userId: string,
    termId: string,
  ): Promise<TermWithProgressDto> {
    const term = await this.termRepository.findOne({ where: { id: termId } });
    if (!term) {
      throw new NotFoundException('Term not found');
    }

    const module = await this.moduleRepository.findOne({
      where: { id: term.moduleId },
    });

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    const isOwner = module.userId === userId;
    if (module.isPrivate && !isOwner) {
      throw new ForbiddenException('Module is private');
    }

    const progressRow = await this.userTermProgressRepository.findOne({
      where: { userId, termId },
    });

    const isCollected =
      isOwner ||
      (await this.userModuleRepository.exist({
        where: { userId, moduleId: module.id },
      }));

    if (isCollected && !progressRow) {
      await this.ensureProgressRecords(userId, module.id, isOwner);
      return this.getProgress(userId, termId);
    }

    return plainToInstance(
      TermWithProgressDto,
      {
        ...term,
        status: progressRow?.status ?? 'not_started',
        isStarred: progressRow?.isStarred ?? false,
      },
      { excludeExtraneousValues: true },
    );
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
}
