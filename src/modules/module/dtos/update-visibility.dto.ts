import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateVisibilityDto {
  @ApiProperty({
    example: false,
    description: 'Set to false to make the module public',
  })
  @IsBoolean()
  isPrivate: boolean;
}
