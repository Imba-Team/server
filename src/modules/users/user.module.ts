import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './user.controller';
import { UsersService } from './user.service';
import { User } from 'src/infrastructure/persistence/entities/user.entity';
import { Repository } from 'typeorm';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService, Repository<User>],
  exports: [UsersService, Repository<User>],
})
export class UsersModule {}
