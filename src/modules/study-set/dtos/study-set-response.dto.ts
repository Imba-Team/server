import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { FlashcardWithProgressDto } from 'src/modules/flashcard/dtos/flashcard-with-progress.dto';

export class StudySetResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  slug: string;

  @ApiProperty()
  @Expose()
  title: string;

  @ApiProperty()
  @Expose()
  description: string;

  @ApiProperty({ description: 'true = private, false = public' })
  @Expose()
  isPrivate: boolean;

  @ApiProperty({ description: 'Owner id' })
  @Expose()
  userId: string;

  @ApiProperty({ required: false })
  @Expose()
  ownerName?: string;

  @ApiProperty({ required: false })
  @Expose()
  ownerImg?: string;

  @ApiProperty({ example: false })
  @Expose()
  isOwner: boolean;

  @ApiProperty({ example: true, required: false })
  @Expose()
  isCollected?: boolean;

  @ApiProperty({ example: 0 })
  @Expose()
  flashcardsCount?: number;

  @ApiProperty({
    example: { not_started: 0.3, in_progress: 0.4, completed: 0.3 },
  })
  @Expose()
  progress?: {
    not_started: number;
    in_progress: number;
    completed: number;
  };

  @ApiProperty({
    type: FlashcardWithProgressDto,
    isArray: true,
    required: false,
  })
  @Expose()
  @Type(() => FlashcardWithProgressDto)
  flashcards?: FlashcardWithProgressDto[];
}
