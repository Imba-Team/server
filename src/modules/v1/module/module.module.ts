import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModuleController } from './module.controller';
import { ModuleService } from './module.service';
import { Module as ModuleEntity } from './module.entity';
import { UsersModule } from '../../users/user.module';
import { User } from '../../users/user.entity';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ModuleEntity]),
    UsersModule,
    AuthModule,
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [ModuleController],
  providers: [ModuleService],
  exports: [ModuleService],
})
export class ModuleModule {}
