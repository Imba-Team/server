import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsUUID,
} from 'class-validator';

export class CreateTermDto {
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

  @ApiProperty({ example: 'not_studied', required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isStarred?: boolean;

  @ApiProperty({ example: '978-0345391803', required: false })
  @IsString()
  @IsOptional()
  isbn?: string;

  @ApiProperty({ example: 'Science Fiction', required: false })
  @IsString()
  @IsOptional()
  genre?: string;

  @ApiProperty({ example: 300, required: false })
  @IsNumber()
  @IsOptional()
  pages?: number;

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    description: 'Module ID this term belongs to',
  })
  @IsUUID()
  @IsNotEmpty()
  moduleId: string;
}
