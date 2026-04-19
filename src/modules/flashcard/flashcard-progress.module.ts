import { Module } from '@nestjs/common';
import { FlashcardProgressController } from './flashcard-progress.controller';
import { FlashcardProgressService } from './flashcard-progress.service';
import { AuthModule } from 'src/modules/auth/auth.module';
import { UsersModule } from 'src/modules/users/user.module';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [FlashcardProgressController],
  providers: [FlashcardProgressService],
  exports: [FlashcardProgressService],
})
export class FlashcardModule {}
