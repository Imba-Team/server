import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class TermResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' })
  @Expose()
  id: string;

  @ApiProperty({ example: "The Hitchhiker's Guide to the Galaxy" })
  @Expose()
  title: string;

  @ApiProperty({ example: 'Douglas Adams' })
  @Expose()
  author: string;

  @ApiProperty({ example: '978-0345391803' })
  @Expose()
  isbn: string;

  @ApiProperty({ example: 'Science Fiction' })
  @Expose()
  genre: string;

  @ApiProperty({ example: 300 })
  @Expose()
  pages: number;

  @ApiProperty({ example: '1979-10-12T00:00:00.000Z' })
  @Expose()
  publishedDate: Date;

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    description: 'ID of the user who owns this term',
  })
  @Expose()
  userId: string;

  @ApiProperty({ example: '2023-10-27T10:00:00.000Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ example: '2023-10-27T10:30:00.000Z' })
  @Expose()
  updatedAt: Date;
}
