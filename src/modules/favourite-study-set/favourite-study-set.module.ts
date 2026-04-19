import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from 'src/modules/auth/auth.module';
import { LoggerModule } from 'src/common/logger/logger.module';
import { StudySet } from 'src/infrastructure/persistence/entities/study-set.entity';
import { StudySetModule } from 'src/modules/study-set/study-set.module';
import { UsersModule } from 'src/modules/users/user.module';

import { FavouriteStudySetController } from './favourite-study-set.controller';
import { FavouriteStudySet } from './favourite-study-set.entity';
import { FavouriteStudySetService } from './favourite-study-set.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([FavouriteStudySet, StudySet]),
    AuthModule,
    LoggerModule,
    StudySetModule,
    UsersModule,
  ],
  controllers: [FavouriteStudySetController],
  providers: [FavouriteStudySetService],
  exports: [FavouriteStudySetService],
})
export class FavouriteStudySetModule {}
