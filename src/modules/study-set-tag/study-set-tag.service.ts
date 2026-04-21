import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StudySetVisibility } from '@prisma/client';

import { Role } from 'src/common/decorators/roles.decorator';
import { IUser } from 'src/common/interfaces/user.interface';
import { LoggerService } from 'src/common/logger/logger.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { slugify } from 'src/common/utils/sligify';

import { CreateStudySetTagDto } from './dto/create-study-set-tag.dto';

@Injectable()
export class StudySetTagService {
  constructor(
    private readonly logger: LoggerService,
    private readonly prisma: PrismaService,
  ) {
    this.logger.setContext(StudySetTagService.name);
  }

  async addTagToStudySet(user: IUser, dto: CreateStudySetTagDto) {
    const { studySetId, tagName } = dto as {
      studySetId: string;
      tagName: string;
    };

    const [studySet, tag] = await Promise.all([
      this.prisma.studySet.findUnique({ where: { id: studySetId } }),
      this.findOrCreateTagByName(tagName),
    ]);

    if (!studySet) {
      throw new NotFoundException('Study set not found');
    }

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    this.assertCanModifyStudySetTags(user, studySet.userId);

    const existing = await this.prisma.studySetTag.findUnique({
      where: {
        studySetId_tagId: {
          studySetId,
          tagId: tag.id,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Tag is already attached to this study set');
    }

    return this.prisma.studySetTag.create({
      data: {
        studySetId,
        tagId: tag.id,
      },
    });
  }

  async removeTagFromStudySet(user: IUser, studySetId: string, tagId: string) {
    const existing = await this.prisma.studySetTag.findUnique({
      where: {
        studySetId_tagId: {
          studySetId,
          tagId,
        },
      },
      include: {
        studySet: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Study set tag relation not found');
    }

    this.assertCanModifyStudySetTags(user, existing.studySet.userId);

    await this.prisma.studySetTag.delete({
      where: {
        studySetId_tagId: {
          studySetId,
          tagId,
        },
      },
    });
  }

  async listTagsForStudySet(user: IUser, studySetId: string) {
    const studySet = await this.prisma.studySet.findUnique({
      where: { id: studySetId },
    });

    if (!studySet) {
      throw new NotFoundException('Study set not found');
    }

    this.assertCanViewStudySet(user, studySet.visibility, studySet.userId);

    const links = await this.prisma.studySetTag.findMany({
      where: { studySetId },
      include: {
        tag: true,
      },
      orderBy: {
        tag: {
          name: 'asc',
        },
      },
    });

    return links.map((link) => link.tag);
  }

  async listStudySetsForTag(user: IUser, tagId: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { id: tagId },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    const where =
      user.role === Role.ADMIN
        ? { tags: { some: { tagId } } }
        : {
            tags: { some: { tagId } },
            OR: [
              { visibility: StudySetVisibility.PUBLIC },
              { userId: user.id },
            ],
          };

    return this.prisma.studySet.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        visibility: true,
        userId: true,
      },
    });
  }

  // Write access: only the owner can modify tag relations, while admin can moderate any study set.
  private assertCanModifyStudySetTags(user: IUser, ownerId: string): void {
    if (user.role === Role.ADMIN) {
      return;
    }

    if (user.id !== ownerId) {
      throw new ForbiddenException(
        'You can only manage tags for your own study sets',
      );
    }
  }

  // Read access: private study sets are visible only to owner/admin; public and unlisted remain readable.
  private assertCanViewStudySet(
    user: IUser,
    visibility: StudySetVisibility,
    ownerId: string,
  ): void {
    if (user.role === Role.ADMIN || user.id === ownerId) {
      return;
    }

    if (visibility !== StudySetVisibility.PRIVATE) {
      return;
    }

    throw new ForbiddenException('Study set is private');
  }

  // Normalizes the incoming tag name into a slug and reuses an existing tag before creating a new one.
  private async findOrCreateTagByName(name: string) {
    const slug = slugify(name);

    const existing = await this.prisma.tag.findFirst({
      where: {
        OR: [{ name }, { slug }],
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.tag.create({
      data: {
        name,
        slug,
      },
    });
  }
}
