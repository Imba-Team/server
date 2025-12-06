import { PartialType } from '@nestjs/swagger';
import { CreateTermDto } from './create-term';

export class UpdateTermDto extends PartialType(CreateTermDto) {}
