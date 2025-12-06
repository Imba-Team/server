import { PartialType } from '@nestjs/swagger';
import { CreateModuleV2Dto } from './create-module.dto';

export class UpdateModuleV2Dto extends PartialType(CreateModuleV2Dto) {}
