import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TermProgressV2Controller } from './term-progress.controller';
import { TermProgressV2Service } from './term-progress.service';
import { Term } from '../../v1/terms/term.entity';
import { Module as ModuleEntity } from '../../v1/module/module.entity';
import { UserModule } from '../module/user-module.entity';
import { UserTermProgress } from './user-term-progress.entity';
import { AuthModule } from '../../auth/auth.module';
import { UsersModule } from '../../users/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Term,
      ModuleEntity,
      UserModule,
      UserTermProgress,
    ]),
    AuthModule,
    UsersModule,
  ],
  controllers: [TermProgressV2Controller],
  providers: [TermProgressV2Service],
  exports: [TermProgressV2Service],
})
export class TermProgressV2Module {}
