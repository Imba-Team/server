import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from 'src/guards/jwt.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles, Role } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { IUser } from 'src/common/interfaces/user.interface';
import { TermProgressV2Service } from './term-progress.service';
import { UpdateTermProgressDto } from './dtos/update-term-progress.dto';
import { ResponseDto } from 'src/common/interfaces/response.dto';
import { TermWithProgressDto } from './dtos/term-with-progress.dto';
import { plainToInstance } from 'class-transformer';

@ApiTags('Terms v2')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.USER, Role.ADMIN)
@Controller('v2/terms')
export class TermProgressV2Controller {
  constructor(private readonly termProgressService: TermProgressV2Service) {}

  @Patch(':id/progress')
  @HttpCode(200)
  @ApiOperation({ summary: 'Update my progress for a term' })
  @ApiBody({ type: UpdateTermProgressDto })
  async updateProgress(
    @CurrentUser() user: IUser,
    @Param('id') id: string,
    @Body() dto: UpdateTermProgressDto,
  ): Promise<ResponseDto<TermWithProgressDto>> {
    const term = await this.termProgressService.updateProgress(
      user.id,
      id,
      dto,
    );
    const data = plainToInstance(TermWithProgressDto, term, {
      excludeExtraneousValues: true,
    });
    return { ok: true, message: 'Progress updated', data };
  }

  @Post(':id/update-status')
  @HttpCode(200)
  @ApiOperation({ summary: 'Update the status of a term by ID' })
  @ApiBody({ schema: { properties: { success: { type: 'boolean' } } } })
  async updateStatus(
    @CurrentUser() user: IUser,
    @Param('id') id: string,
    @Body('success') success: boolean,
  ): Promise<ResponseDto<TermWithProgressDto>> {
    const term = await this.termProgressService.updateStatus(
      user.id,
      id,
      success,
    );
    const data = plainToInstance(TermWithProgressDto, term, {
      excludeExtraneousValues: true,
    });
    return { ok: true, message: 'Term status updated successfully', data };
  }

  @Get(':id/progress')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get my progress for a term' })
  async getProgress(
    @CurrentUser() user: IUser,
    @Param('id') id: string,
  ): Promise<ResponseDto<TermWithProgressDto>> {
    const term = await this.termProgressService.getProgress(user.id, id);
    const data = plainToInstance(TermWithProgressDto, term, {
      excludeExtraneousValues: true,
    });
    return { ok: true, message: 'Progress retrieved', data };
  }
}
