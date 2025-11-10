import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class BookFilterDto {
  @ApiProperty({ example: 'Science Fiction', required: false })
  @IsString()
  @IsOptional()
  genre?: string;

  @ApiProperty({ example: 'Adams', required: false })
  @IsString()
  @IsOptional()
  author?: string;

  @ApiProperty({ example: 'Hitchhiker', required: false })
  @IsString()
  @IsOptional()
  title?: string;
}
