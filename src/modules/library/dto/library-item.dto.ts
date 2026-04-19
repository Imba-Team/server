import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

import { StudySetVisibility } from 'src/infrastructure/persistence/enums';

export class LibraryItemDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  slug: string;

  @ApiProperty()
  @Expose()
  title: string;

  @ApiProperty({ required: false, nullable: true })
  @Expose()
  description: string | null;

  @ApiProperty({ enum: StudySetVisibility })
  @Expose()
  visibility: StudySetVisibility;

  @ApiProperty({ required: false, nullable: true })
  @Expose()
  language: string | null;

  @ApiProperty()
  @Expose()
  userId: string;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  @ApiProperty({ example: true })
  @Expose()
  isOwner: boolean;

  @ApiProperty({ example: false })
  @Expose()
  isFavourited: boolean;
}
