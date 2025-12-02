import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ModuleResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'module-name' })
  @Expose()
  slug: string;

  @ApiProperty({ example: 'Module Name' })
  @Expose()
  title: string;

  @ApiProperty({ example: 'Example of the description' })
  @Expose()
  description: string;

  @ApiProperty({ example: true })
  @Expose()
  isPrivate: boolean;

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    description: 'The ID of the user who owns this module',
  })
  @Expose()
  userId: string;

  @ApiProperty({ example: 0 })
  @Expose()
  termsCount?: number;

  @ApiProperty({
    example: { not_started: 0.3, in_progress: 0.4, completed: 0.3 },
  })
  @Expose()
  progress?: {
    not_started: number;
    in_progress: number;
    completed: number;
  };
}
