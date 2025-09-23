import { Module } from '@nestjs/common';
import { MediasoupService } from './mediasoup.service';
import { MediasoupGateway } from './mediasoup.gateway';
import { MediasoupController } from './mediasoup.controller';

@Module({
  providers: [MediasoupService, MediasoupGateway],
  exports: [MediasoupService],
  controllers: [MediasoupController],
})
export class MediasoupModule {}
