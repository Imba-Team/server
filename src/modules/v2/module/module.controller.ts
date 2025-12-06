import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtGuard } from 'src/guards/jwt.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { IUser } from 'src/common/interfaces/user.interface';
import { Roles, Role } from 'src/common/decorators/roles.decorator';
import { ResponseDto } from 'src/common/interfaces/response.dto';
import { ModuleV2Service } from './module.service';
import { CreateModuleV2Dto } from './dtos/create-module.dto';
import { UpdateModuleV2Dto } from './dtos/update-module.dto';
import { UpdateVisibilityDto } from './dtos/update-visibility.dto';
import { SearchModulesDto } from './dtos/search-modules.dto';
import { ModuleResponseV2Dto } from './dtos/module-response.dto';
import { plainToInstance } from 'class-transformer';

@ApiTags('Modules v2')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.USER, Role.ADMIN)
@Controller('v2/modules')
export class ModuleV2Controller {
  constructor(private readonly moduleService: ModuleV2Service) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a module (v2)' })
  @ApiBody({ type: CreateModuleV2Dto })
  async create(
    @CurrentUser() user: IUser,
    @Body() dto: CreateModuleV2Dto,
  ): Promise<ResponseDto<ModuleResponseV2Dto>> {
    const module = await this.moduleService.create(user.id, dto);
    const data = plainToInstance(ModuleResponseV2Dto, module, {
      excludeExtraneousValues: true,
    });

    return { ok: true, message: 'Module created', data };
  }

  @Patch(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Update own module (v2)' })
  @ApiBody({ type: UpdateModuleV2Dto })
  async update(
    @CurrentUser() user: IUser,
    @Param('id') id: string,
    @Body() dto: UpdateModuleV2Dto,
  ): Promise<ResponseDto<ModuleResponseV2Dto>> {
    const module = await this.moduleService.update(user.id, id, dto);
    const data = plainToInstance(ModuleResponseV2Dto, module, {
      excludeExtraneousValues: true,
    });
    return { ok: true, message: 'Module updated', data };
  }

  @Patch(':id/visibility')
  @HttpCode(200)
  @ApiOperation({ summary: 'Make module public/private' })
  async updateVisibility(
    @CurrentUser() user: IUser,
    @Param('id') id: string,
    @Body() dto: UpdateVisibilityDto,
  ): Promise<ResponseDto<ModuleResponseV2Dto>> {
    const module = await this.moduleService.updateVisibility(user.id, id, dto);
    const data = plainToInstance(ModuleResponseV2Dto, module, {
      excludeExtraneousValues: true,
    });
    return { ok: true, message: 'Visibility updated', data };
  }

  @Get('me')
  @HttpCode(200)
  @ApiOperation({ summary: 'List my modules with progress' })
  async myModules(
    @CurrentUser() user: IUser,
  ): Promise<ResponseDto<ModuleResponseV2Dto[]>> {
    const modules = await this.moduleService.findMyModules(user.id);
    const data = modules.map((m) =>
      plainToInstance(ModuleResponseV2Dto, m, {
        excludeExtraneousValues: true,
      }),
    );
    return { ok: true, message: 'Modules retrieved', data };
  }

  @Get('collection')
  @HttpCode(200)
  @ApiOperation({ summary: 'List modules in my collection' })
  async myCollection(
    @CurrentUser() user: IUser,
  ): Promise<ResponseDto<ModuleResponseV2Dto[]>> {
    const modules = await this.moduleService.findCollection(user.id);
    const data = modules.map((m) =>
      plainToInstance(ModuleResponseV2Dto, m, {
        excludeExtraneousValues: true,
      }),
    );
    return { ok: true, message: 'Collection retrieved', data };
  }

  @Get('public')
  @HttpCode(200)
  @ApiQuery({ name: 'q', required: false })
  @ApiOperation({ summary: 'Search public modules' })
  async publicModules(
    @CurrentUser() user: IUser,
    @Query() query: SearchModulesDto,
  ): Promise<ResponseDto<ModuleResponseV2Dto[]>> {
    const modules = await this.moduleService.searchPublic(user.id, query);
    const data = modules.map((m) =>
      plainToInstance(ModuleResponseV2Dto, m, {
        excludeExtraneousValues: true,
      }),
    );
    return { ok: true, message: 'Public modules retrieved', data };
  }

  @Post(':id/collect')
  @HttpCode(200)
  @ApiOperation({ summary: 'Add a public module to my collection' })
  async collect(
    @CurrentUser() user: IUser,
    @Param('id') id: string,
  ): Promise<ResponseDto<ModuleResponseV2Dto>> {
    const module = await this.moduleService.addToCollection(user.id, id);
    const data = plainToInstance(ModuleResponseV2Dto, module, {
      excludeExtraneousValues: true,
    });
    return { ok: true, message: 'Module added to collection', data };
  }

  @Get(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get module details with personal progress' })
  async getOne(
    @CurrentUser() user: IUser,
    @Param('id') id: string,
  ): Promise<ResponseDto<ModuleResponseV2Dto>> {
    const module = await this.moduleService.getById(user.id, id);
    const data = plainToInstance(ModuleResponseV2Dto, module, {
      excludeExtraneousValues: true,
    });
    return { ok: true, message: 'Module retrieved', data };
  }
}
