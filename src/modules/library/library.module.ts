import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from 'src/modules/auth/auth.module';
import { FavouriteStudySetModule } from 'src/modules/favourite-study-set/favourite-study-set.module';
import { FavouriteStudySet } from 'src/modules/favourite-study-set/favourite-study-set.entity';
import { LoggerModule } from 'src/common/logger/logger.module';
import { StudySetModule } from 'src/modules/study-set/study-set.module';
import { UsersModule } from 'src/modules/users/user.module';
import { StudySet } from 'src/infrastructure/persistence/entities/study-set.entity';

import { LibraryController } from './library.controller';
import { LibraryService } from './library.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([StudySet, FavouriteStudySet]),
    AuthModule,
    LoggerModule,
    StudySetModule,
    FavouriteStudySetModule,
    UsersModule,
  ],
  controllers: [LibraryController],
  providers: [LibraryService],
})
export class LibraryModule {}
