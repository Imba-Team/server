import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsUUID,
} from 'class-validator';

export class CreateTermDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    description: 'Module ID this term belongs to',
  })
  @IsUUID()
  @IsNotEmpty()
  moduleId: string;

  @ApiProperty({ example: 'Photosynthesis' })
  @IsString()
  @IsNotEmpty()
  term: string;

  @ApiProperty({
    example: 'The process by which green plants convert sunlight into energy.',
  })
  @IsString()
  @IsNotEmpty()
  definition: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isStarred?: boolean;
}
