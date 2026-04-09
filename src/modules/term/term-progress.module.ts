import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TermProgressController } from './term-progress.controller';
import { TermProgressService } from './term-progress.service';
import { Term } from 'src/infrastructure/persistence/entities/term.entity';
import { Module as ModuleEntity } from 'src/infrastructure/persistence/entities/module.entity';
import { UserModule } from 'src/infrastructure/persistence/entities/user-module.entity';
import { UserTermProgress } from 'src/infrastructure/persistence/entities/user-term-progress.entity';
import { AuthModule } from 'src/modules/auth/auth.module';
import { UsersModule } from 'src/modules/users/user.module';

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
  controllers: [TermProgressController],
  providers: [TermProgressService],
  exports: [TermProgressService],
})
export class TermModule {}
