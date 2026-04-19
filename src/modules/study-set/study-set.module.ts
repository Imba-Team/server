import { Module } from '@nestjs/common';
import { UsersModule } from 'src/modules/users/user.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { StudySetController } from './study-set.controller';
import { StudySetService } from './study-set.service';

@Module({
  imports: [UsersModule, AuthModule],
  controllers: [StudySetController],
  providers: [StudySetService],
  exports: [StudySetService],
})
export class StudySetModule {}
