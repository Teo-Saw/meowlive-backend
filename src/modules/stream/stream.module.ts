import { Module } from '@nestjs/common';
import { StreamService } from './stream.service';
import { StreamController } from './stream.controller';
import { StreamGateway } from './stream.gateway';

@Module({
  providers: [StreamService, StreamGateway],
  controllers: [StreamController],
  exports: [StreamService],
})
export class StreamModule {}
