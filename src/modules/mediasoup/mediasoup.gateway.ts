import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { MediasoupService } from './mediasoup.service';
import * as mediasoup from 'mediasoup';
import type {
  RtpCapabilities,
  WebRtcTransport,
  Producer,
  Consumer,
} from 'node_modules/mediasoup/node/lib/types';

interface ProduceDto {
  transportId: string;
  kind: 'audio' | 'video';
  rtpParameters: mediasoup.types.RtpParameters;
}

interface ConsumeDto {
  transportId: string;
  producerId: string;
  rtpCapabilities: RtpCapabilities;
}

@WebSocketGateway({ cors: true })
export class MediasoupGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly mediasoupService: MediasoupService) {}

  //Frontend asks which audio/video codecs backend supports
  @SubscribeMessage('getRouterRtpCapabilities')
  async getRouterRtpCapabilities(): Promise<RtpCapabilities> {
    const router = await this.mediasoupService.getRouter();
    return router.rtpCapabilities;
  }

  //To create a WebRTC transport and returns ICE/DTLS info (a "pipe" to send or receive media)
  @SubscribeMessage('createWebRtcTransport')
  async createWebRtcTransport(): Promise<any> {
    const transport = await this.mediasoupService.createWebRtcTransport();
    // Store transport in a Map for later use (sending/receiving media)
    this.mediasoupService.transports.set(transport.id, transport);
    return {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    };
  }

  // Frontend sends camera/mic (produce)
  @SubscribeMessage('produce')
  async produce(@MessageBody() data: any): Promise<any> {
    const { transportId, kind, rtpParameters } = data;
    // "Produce" means: create a stream (audio/video) on the server for other peers
    const producer: Producer = await this.mediasoupService.produce(
      transportId,
      kind,
      rtpParameters,
    );

    // Return the producer ID to the frontend so it can manage or stop it later
    return { id: producer.id };
  }

  // Frontend wants to **receive another peer's stream**
  @SubscribeMessage('consume')
  async consume(@MessageBody() data: any): Promise<any> {
    const { transportId, producerId, rtpCapabilities } = data;
    // "Consume" means: create a consumer that receives a producer's media
    // The backend checks if the consumer can handle the producer's media format
    const consumer: Consumer = await this.mediasoupService.consume(
      transportId,
      producerId,
      rtpCapabilities,
    );
    // Return all information needed for frontend to play the remote media
    return {
      id: consumer.id,
      producerId: consumer.producerId,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
    };
  }
}
