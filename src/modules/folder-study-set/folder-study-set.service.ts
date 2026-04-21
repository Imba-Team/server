import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StudySetVisibility } from '@prisma/client';

import { LoggerService } from 'src/common/logger/logger.service';
import { IUser } from 'src/common/interfaces/user.interface';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { FolderService } from 'src/modules/folder/folder.service';

import { AddFolderStudySetsDto } from './dto/add-folder-study-sets.dto';

@Injectable()
export class FolderStudySetService {
  constructor(
    private readonly logger: LoggerService,
    private readonly prisma: PrismaService,
    private readonly folderService: FolderService,
  ) {
    this.logger.setContext(FolderStudySetService.name);
  }

  async addStudySetsToFolder(
    user: IUser,
    folderId: string,
    dto: AddFolderStudySetsDto,
  ) {
    await this.folderService.findOwnedFolderOrFail(user.id, folderId);

    const incomingIds = [...new Set(dto.studySetIds)];
    const studySets = await this.prisma.studySet.findMany({
      where: {
        id: { in: incomingIds },
      },
      select: {
        id: true,
        userId: true,
        visibility: true,
      },
    });

    if (studySets.length !== incomingIds.length) {
      const foundIds = new Set(studySets.map((studySet) => studySet.id));
      const missingIds = incomingIds.filter((id) => !foundIds.has(id));
      throw new NotFoundException(
        `Study set not found for ids: ${missingIds.join(', ')}`,
      );
    }

    const privateNotOwnedIds = studySets
      .filter(
        (studySet) =>
          studySet.userId !== user.id &&
          studySet.visibility === StudySetVisibility.PRIVATE,
      )
      .map((studySet) => studySet.id);

    if (privateNotOwnedIds.length > 0) {
      throw new ForbiddenException(
        `Cannot add private study sets you do not own: ${privateNotOwnedIds.join(', ')}`,
      );
    }

    const existingLinks = await this.prisma.folderStudySet.findMany({
      where: {
        folderId,
        studySetId: { in: incomingIds },
      },
      select: {
        studySetId: true,
      },
    });

    const existingIds = new Set(existingLinks.map((link) => link.studySetId));
    const toCreate = incomingIds.filter((id) => !existingIds.has(id));

    if (toCreate.length === 0) {
      throw new ConflictException('All study sets are already in the folder');
    }

    await this.prisma.folderStudySet.createMany({
      data: toCreate.map((studySetId) => ({ folderId, studySetId })),
      skipDuplicates: true,
    });

    return {
      addedStudySetIds: toCreate,
      skippedStudySetIds: [...existingIds],
    };
  }

  async removeStudySetFromFolder(
    user: IUser,
    folderId: string,
    studySetId: string,
  ) {
    await this.folderService.findOwnedFolderOrFail(user.id, folderId);

    const deleted = await this.prisma.folderStudySet.deleteMany({
      where: {
        folderId,
        studySetId,
      },
    });

    if (!deleted.count) {
      throw new NotFoundException('Study set is not in the folder');
    }
  }

  async listStudySetsInFolder(user: IUser, folderId: string) {
    await this.folderService.findOwnedFolderOrFail(user.id, folderId);

    const links = await this.prisma.folderStudySet.findMany({
      where: { folderId },
      include: {
        studySet: {
          select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            visibility: true,
            userId: true,
          },
        },
      },
      orderBy: {
        studySet: {
          createdAt: 'desc',
        },
      },
    });

    return links.map((link) => ({
      ...link.studySet,
      isPrivate: link.studySet.visibility === StudySetVisibility.PRIVATE,
    }));
  }
}
