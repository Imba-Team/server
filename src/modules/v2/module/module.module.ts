import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module as ModuleEntity } from '../../v1/module/module.entity';
import { User } from '../../users/user.entity';
import { UsersModule } from '../../users/user.module';
import { AuthModule } from '../../auth/auth.module';
import { ModuleV2Controller } from './module.controller';
import { ModuleV2Service } from './module.service';
import { UserModule } from './user-module.entity';
import { Term } from '../../v1/terms/term.entity';
import { UserTermProgress } from '../term/user-term-progress.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ModuleEntity,
      User,
      UserModule,
      Term,
      UserTermProgress,
    ]),
    UsersModule,
    AuthModule,
  ],
  controllers: [ModuleV2Controller],
  providers: [ModuleV2Service],
  exports: [ModuleV2Service],
})
export class ModuleV2Module {}
