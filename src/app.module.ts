import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfigAsync } from './config/typeorm.config';
import { UsersModule } from './modules/users/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { LoggerModule } from './common/logger/logger.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { ModuleModule } from './modules/v1/module/module.module';
import { TermModule } from './modules/v1/terms/term.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ModuleV2Module } from './modules/v2/module/module.module';
import { TermProgressV2Module } from './modules/v2/term/term-progress.module';

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
    ModuleModule,
    TermModule,
    ModuleV2Module,
    TermProgressV2Module,
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync(typeOrmConfigAsync),
  ],
})
export class AppModule {}
