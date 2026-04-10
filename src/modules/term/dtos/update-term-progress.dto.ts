import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import type { TermProgressStatus } from 'src/infrastructure/persistence/flashcard-user-state.mapper';

export class UpdateTermProgressDto {
  @ApiPropertyOptional({ enum: ['not_started', 'in_progress', 'completed'] })
  @IsEnum(['not_started', 'in_progress', 'completed'])
  @IsOptional()
  status?: TermProgressStatus;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isStarred?: boolean;
}
