import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudySet } from 'src/infrastructure/persistence/entities/study-set.entity';
import { User } from 'src/infrastructure/persistence/entities/user.entity';
import { UsersModule } from 'src/modules/users/user.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { StudySetController } from './study-set.controller';
import { StudySetService } from './study-set.service';
import { FavoriteStudySet } from 'src/infrastructure/persistence/entities/favorite-study-set.entity';
import { Flashcard } from 'src/infrastructure/persistence/entities/flashcard.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([StudySet, User, FavoriteStudySet, Flashcard]),
    UsersModule,
    AuthModule,
  ],
  controllers: [StudySetController],
  providers: [StudySetService],
  exports: [StudySetService],
})
export class StudySetModule {}
