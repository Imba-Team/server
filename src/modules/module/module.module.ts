import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudySet } from 'src/infrastructure/persistence/entities/study-set.entity';
import { User } from 'src/infrastructure/persistence/entities/user.entity';
import { UsersModule } from 'src/modules/users/user.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { ModuleController } from './module.controller';
import { ModuleService } from './module.service';
import { FavoriteStudySet } from 'src/infrastructure/persistence/entities/favorite-study-set.entity';
import { Flashcard } from 'src/infrastructure/persistence/entities/flashcard.entity';
import { FlashcardUserState } from 'src/infrastructure/persistence/entities/flashcard-user-state.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StudySet,
      User,
      FavoriteStudySet,
      Flashcard,
      FlashcardUserState,
    ]),
    UsersModule,
    AuthModule,
  ],
  controllers: [ModuleController],
  providers: [ModuleService],
  exports: [ModuleService],
})
export class ModuleModule {}
