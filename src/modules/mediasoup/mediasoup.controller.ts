import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiBody, ApiProperty } from '@nestjs/swagger';
import { MediasoupService } from './mediasoup.service';
import type { RtpCapabilities, WebRtcTransport, Producer, Consumer, RtpParameters } from 'node_modules/mediasoup/node/lib/types';
import {ProduceDto, ConsumeDto} from './dto';

@ApiTags('mediasoup')
@Controller('mediasoup')
export class MediasoupController {
  constructor(private readonly mediasoupService: MediasoupService) {}

  // Get router RTP capabilities
  @Get('rtp-capabilities')
  @ApiOkResponse({
    description: 'Router RTP capabilities (audio/video codecs supported)',
    schema: {
      example: {
        codecs: [
          { kind: 'audio', mimeType: 'audio/opus', clockRate: 48000, channels: 2 },
          { kind: 'video', mimeType: 'video/VP8', clockRate: 90000 }
        ],
        headerExtensions: [],
      },
    },
  })
  async getRouterRtpCapabilities(): Promise<RtpCapabilities> {
    const router = await this.mediasoupService.getRouter();
    return router.rtpCapabilities;
  }

  // Create WebRTC transport
  @Post('create-transport')
  @ApiOkResponse({
    description: 'Created WebRTC transport (send/receive)',
    schema: {
      example: {
        id: 'transport-id-123',
        iceParameters: { usernameFragment: 'abc', password: 'xyz', iceLite: true },
        iceCandidates: [
          { foundation: '1', priority: 12345, ip: '127.0.0.1', protocol: 'udp', port: 10000, type: 'host' }
        ],
        dtlsParameters: { role: 'auto', fingerprints: [{ algorithm: 'sha-256', value: 'AB:CD:...' }] },
      },
    },
  })
  async createTransport(): Promise<Partial<WebRtcTransport>> {
    const transport = await this.mediasoupService.createWebRtcTransport();
    this.mediasoupService.transports.set(transport.id, transport);
    return {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    };
  }

  // Produce media
  @Post('produce')
  @ApiBody({ type: ProduceDto })
  @ApiOkResponse({
    description: 'Producer created (frontend sends camera/mic)',
    schema: { example: { id: 'producer-id-456' } },
  })
  async produce(@Body() body: ProduceDto): Promise<{ id: string }> {
    const { transportId, kind, rtpParameters } = body;
    const producer: Producer = await this.mediasoupService.produce(
      transportId,
      kind,
      rtpParameters,
    );
    return { id: producer.id };
  }

  // Consume media
  @Post('consume')
  @ApiBody({ type: ConsumeDto })
  @ApiOkResponse({
    description: 'Consumer created (frontend receives media)',
    schema: {
      example: {
        id: 'consumer-id-789',
        producerId: 'producer-id-456',
        kind: 'video',
        rtpParameters: {
          codecs: [],
          headerExtensions: [],
          encodings: [],
        },
      },
    },
  })
  async consume(@Body() body: ConsumeDto): Promise<any> {
    const { transportId, producerId, rtpCapabilities } = body;
    const consumer: Consumer = await this.mediasoupService.consume(
      transportId,
      producerId,
      rtpCapabilities,
    );
    return {
      id: consumer.id,
      producerId: consumer.producerId,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
    };
  }
}