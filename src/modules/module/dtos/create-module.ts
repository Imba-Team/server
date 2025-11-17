import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsDateString,
} from 'class-validator';

export class CreateModuleDto {
  @ApiProperty({ example: "The Hitchhiker's Guide to the Galaxy" })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Douglas Adams' })
  @IsString()
  @IsNotEmpty()
  author: string;

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

  @ApiProperty({ example: '1979-10-12', required: false })
  @IsDateString()
  @IsOptional()
  publishedDate?: string;
}
