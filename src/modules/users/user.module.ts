import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './user.controller';
import { UsersService } from './user.service';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { AuthModule } from '../auth/auth.module';
import { Subscription } from '../subscription/subscription.entity';
import { AdminUsersController } from './admin-user.controller';
import { Book } from '../books/book.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    AuthModule,
    TypeOrmModule.forFeature([Subscription]),
    TypeOrmModule.forFeature([Book]),
  ],
  controllers: [UsersController, AdminUsersController],
  providers: [UsersService, Repository<User>],
  exports: [UsersService, Repository<User>],
})
export class UsersModule {}
