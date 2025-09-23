import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { StreamService } from './stream.service';
import { Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ cors: { origin: '*' } })
export class StreamGateway {
  private readonly logger = new Logger(StreamGateway.name);

  constructor(private readonly streamService: StreamService) {}

  @SubscribeMessage('start-stream')
  handleStart(@MessageBody() data: { streamKey: string }) {
    this.streamService.startStream(data.streamKey);
    this.logger.log(`Stream started: ${data.streamKey}`);
  }

  @SubscribeMessage('stream-chunk')
  handleChunk(
    @MessageBody() data: { streamKey: string; chunk: ArrayBuffer },
    @ConnectedSocket() _client: Socket,
  ) {
    const buffer = Buffer.from(data.chunk);
    this.streamService.writeChunk(data.streamKey, buffer);
  }

  @SubscribeMessage('stop-stream')
  handleStop(@MessageBody() data: { streamKey: string }) {
    this.streamService.stopStream(data.streamKey);
    this.logger.log(`Stream stopped: ${data.streamKey}`);
  }
}
