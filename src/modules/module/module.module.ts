import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module as ModuleEntity } from 'src/infrastructure/persistence/entities/module.entity';
import { User } from 'src/infrastructure/persistence/entities/user.entity';
import { UsersModule } from 'src/modules/users/user.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { ModuleController } from './module.controller';
import { ModuleService } from './module.service';
import { UserModule } from 'src/infrastructure/persistence/entities/user-module.entity';
import { Term } from 'src/infrastructure/persistence/entities/term.entity';
import { UserTermProgress } from 'src/infrastructure/persistence/entities/user-term-progress.entity';

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
  controllers: [ModuleController],
  providers: [ModuleService],
  exports: [ModuleService],
})
export class ModuleModule {}
