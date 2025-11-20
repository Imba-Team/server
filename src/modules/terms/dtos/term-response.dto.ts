import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class TermResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'Module Name' })
  @Expose()
  term: string;

  @ApiProperty({ example: 'Example of the description' })
  @Expose()
  definition: string;

  @ApiProperty({ example: true })
  @Expose()
  isStarred: boolean;

  @ApiProperty({ example: '2023-10-27T10:00:00.000Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ example: '2023-10-27T10:30:00.000Z' })
  @Expose()
  updatedAt: Date;
}
