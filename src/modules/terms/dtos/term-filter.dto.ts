import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class TermFilterDto {
  @ApiProperty({ example: 'not_studied', required: false })
  @IsString()
  @IsOptional()
  status?: 'not_studied' | 'in_progress' | 'completed';

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  isStarred?: boolean;

  @IsOptional()
  @IsString()
  moduleId?: string;
}
