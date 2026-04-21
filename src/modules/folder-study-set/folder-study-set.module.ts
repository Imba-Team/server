import { Module } from '@nestjs/common';

import { AuthModule } from 'src/modules/auth/auth.module';
import { FolderModule } from 'src/modules/folder/folder.module';
import { UsersModule } from 'src/modules/users/user.module';

import { FolderStudySetController } from './folder-study-set.controller';
import { FolderStudySetService } from './folder-study-set.service';

@Module({
  imports: [FolderModule, AuthModule, UsersModule],
  controllers: [FolderStudySetController],
  providers: [FolderStudySetService],
  exports: [FolderStudySetService],
})
export class FolderStudySetModule {}
