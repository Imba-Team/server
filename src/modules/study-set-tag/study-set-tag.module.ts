import { Module } from '@nestjs/common';
import { AuthModule } from 'src/modules/auth/auth.module';
import { UsersModule } from 'src/modules/users/user.module';

import { TagModule } from '../tag/tag.module';
import { StudySetTagController } from './study-set-tag.controller';
import { StudySetTagService } from './study-set-tag.service';

@Module({
  imports: [TagModule, AuthModule, UsersModule],
  controllers: [StudySetTagController],
  providers: [StudySetTagService],
  exports: [StudySetTagService],
})
export class StudySetTagModule {}
