import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './user.controller';
import { UsersService } from './user.service';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { AuthModule } from '../auth/auth.module';
import { AdminUsersController } from './admin-user.controller';
import { Module as ModuleEntity } from '../module/module.entity';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([User]),
    TypeOrmModule.forFeature([ModuleEntity]),
  ],
  controllers: [UsersController, AdminUsersController],
  providers: [UsersService, Repository<User>],
  exports: [UsersService, Repository<User>],
})
export class UsersModule {}
