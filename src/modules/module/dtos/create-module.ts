import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateModuleDto {
  @ApiProperty({ example: 'Module Title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Description of the module', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;
}
