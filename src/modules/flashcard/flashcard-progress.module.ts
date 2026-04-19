import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FlashcardProgressController } from './flashcard-progress.controller';
import { FlashcardProgressService } from './flashcard-progress.service';
import { Flashcard } from 'src/infrastructure/persistence/entities/flashcard.entity';
import { StudySet } from 'src/infrastructure/persistence/entities/study-set.entity';
import { FavoriteStudySet } from 'src/infrastructure/persistence/entities/favorite-study-set.entity';
import { FlashcardUserState } from 'src/infrastructure/persistence/entities/flashcard-user-state.entity';
import { AuthModule } from 'src/modules/auth/auth.module';
import { UsersModule } from 'src/modules/users/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Flashcard,
      StudySet,
      FavoriteStudySet,
      FlashcardUserState,
    ]),
    AuthModule,
    UsersModule,
  ],
  controllers: [FlashcardProgressController],
  providers: [FlashcardProgressService],
  exports: [FlashcardProgressService],
})
export class FlashcardModule {}
