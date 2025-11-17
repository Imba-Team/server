import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TermController } from './term.controller';
import { TermService } from './term.service';
import { UsersModule } from '../users/user.module';
import { User } from '../users/user.entity';
import { AuthModule } from '../auth/auth.module';
import { Term } from './term.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Term]),
    UsersModule,
    AuthModule,
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [TermController],
  providers: [TermService],
  exports: [TermService],
})
export class TermModule {}
