import { PartialType } from '@nestjs/swagger';
import { CreateModuleDto } from './create-module';

export class UpdateModuleDto extends PartialType(CreateModuleDto) {}
