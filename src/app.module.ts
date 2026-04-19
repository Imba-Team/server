import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfigAsync } from './infrastructure/persistence/typeorm.config';
import { UsersModule } from './modules/users/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { LoggerModule } from './common/logger/logger.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { StudySetModule } from './modules/study-set/study-set.module';
import { FlashcardModule } from './modules/flashcard/flashcard-progress.module';
import { FavouriteStudySetModule } from './modules/favourite-study-set/favourite-study-set.module';
import { LibraryModule } from './modules/library/library.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'), // folder on disk
      serveRoot: '/uploads', // public URL path root
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 10,
        },
      ],
    }),
    LoggerModule,
    UsersModule,
    AuthModule,
    StudySetModule,
    FlashcardModule,
    FavouriteStudySetModule,
    LibraryModule,
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync(typeOrmConfigAsync),
  ],
})
export class AppModule {}
