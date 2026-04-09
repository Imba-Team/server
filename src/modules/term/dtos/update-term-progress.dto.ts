import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { TermProgressStatus } from 'src/infrastructure/persistence/entities/user-term-progress.entity';

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
