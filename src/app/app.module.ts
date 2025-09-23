import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from '../modules/comments/comments.module';
import { MediasoupModule } from '../modules/mediasoup/mediasoup.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { StreamModule } from 'src/modules/stream/stream.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      exclude: ['/api*', '/socket.io*'],
    }),
    UsersModule, MediasoupModule, StreamModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
