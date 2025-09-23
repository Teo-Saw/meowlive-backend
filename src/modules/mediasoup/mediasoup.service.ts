import { Injectable, OnModuleInit } from '@nestjs/common';
import * as mediasoup from 'mediasoup';
import type {
  WebRtcTransport,
  Producer,
  Consumer,
} from 'node_modules/mediasoup/node/lib/types';

@Injectable()
export class MediasoupService implements OnModuleInit {
  private worker: mediasoup.types.Worker;
  private router: mediasoup.types.Router;

  public transports: Map<string, WebRtcTransport> = new Map(); //WebRTC connections
  public producers: Map<string, Producer> = new Map(); //Stores camera/mic streams
  public consumers: Map<string, Consumer> = new Map(); //Stores streams you are watching from others.

  // Initialize worker and router when module starts
  async onModuleInit() {
    await this.createWorker();
    await this.createRouter();
  }

  // Create worker(engine) process
  private async createWorker(): Promise<void> {
    this.worker = await mediasoup.createWorker({
      logLevel: 'warn',
      rtcMinPort: 10000, // Port range for RTC connections
      rtcMaxPort: 10100,
    });

    // Exit application if worker dies (critical failure)
    this.worker.on('died', () => {
      console.error('mediasoup worker has died');
      setTimeout(() => process.exit(1), 2000);
    });
  }

  // Create router with supported audio/video codecs
  private async createRouter(): Promise<void> {
    const mediaCodecs: mediasoup.types.RtpCodecCapability[] = [
      // Audio codecs
      {
        kind: 'audio',
        mimeType: 'audio/opus', // Primary audio codec
        clockRate: 48000,
        channels: 2,
        preferredPayloadType: 111,
      },
      {
        kind: 'audio',
        mimeType: 'audio/PCMU', // Legacy telephony compatibility
        clockRate: 8000,
        channels: 1,
        preferredPayloadType: 0,
      },
      {
        kind: 'audio',
        mimeType: 'audio/PCMA',
        clockRate: 8000,
        channels: 1,
        preferredPayloadType: 8,
      },
      {
        kind: 'audio',
        mimeType: 'audio/G722',
        clockRate: 8000,
        channels: 1,
        preferredPayloadType: 9,
      },
      // Video codecs
      {
        kind: 'video',
        mimeType: 'video/VP8', // Web-optimized codec
        clockRate: 90000,
        preferredPayloadType: 96,
        parameters: {
          'x-google-start-bitrate': 1000,
        },
      },
      {
        kind: 'video',
        mimeType: 'video/VP9',
        clockRate: 90000,
        preferredPayloadType: 97,
        parameters: {
          'profile-id': 2,
          'x-google-start-bitrate': 1000,
        },
      },
      {
        kind: 'video',
        mimeType: 'video/h264', // High profile - better quality
        clockRate: 90000,
        preferredPayloadType: 98,
        parameters: {
          'packetization-mode': 1,
          'profile-level-id': '4d0032',
          'level-asymmetry-allowed': 1,
          'x-google-start-bitrate': 1000,
        },
      },
      {
        kind: 'video',
        mimeType: 'video/h264', // Baseline profile - better compatibility
        clockRate: 90000,
        preferredPayloadType: 99,
        parameters: {
          'packetization-mode': 1,
          'profile-level-id': '42e01f',
          'level-asymmetry-allowed': 1,
          'x-google-start-bitrate': 1000,
        },
      },
    ];

    this.router = await this.worker.createRouter({ mediaCodecs });
  }

  // Get router instance, create if not exists
  async getRouter(): Promise<mediasoup.types.Router> {
    if (!this.router) {
      await this.createRouter();
    }
    return this.router;
  }

  getWorker(): mediasoup.types.Worker {
    return this.worker;
  }

  // Create WebRTC transport for peer connections
  async createWebRtcTransport(): Promise<mediasoup.types.WebRtcTransport> {
    const router = await this.getRouter();
    const webRtcTransportOptions: mediasoup.types.WebRtcTransportOptions = {
      listenIps: [
        {
          ip: '127.0.0.1', // Change to '0.0.0.0' for production
          // announcedIp: 'public-ip', // Set for production behind NAT
        },
      ],
      enableUdp: true, // Preferred for real-time media
      enableTcp: true, // Fallback for restrictive networks
      preferUdp: true,
    };

    const transport = await router.createWebRtcTransport(
      webRtcTransportOptions,
    );
    return transport;
  }

  async produce(
    transportId: string,
    kind: 'audio' | 'video',
    rtpParameters: mediasoup.types.RtpParameters,
  ): Promise<Producer> {
    const transport = this.transports.get(transportId);
    if (!transport) throw new Error('Transport not found');

    // Create producer = send camera or microphone to the server
    const producer = await transport.produce({ kind, rtpParameters });
    this.producers.set(producer.id, producer);
    return producer;
  }

  async consume(
    transportId: string,
    producerId: string,
    rtpCapabilities: mediasoup.types.RtpCapabilities,
  ): Promise<Consumer> {
    const router = await this.getRouter();

    // Check if this consumer can handle the producer's media format
    if (!router.canConsume({ producerId, rtpCapabilities }))
      throw new Error('Cannot consume');

    const transport = this.transports.get(transportId);
    if (!transport) throw new Error('Transport not found');

    // Create a consumer = receive the producer's media
    const consumer = await transport.consume({
    producerId, 
    rtpCapabilities, 
    paused: false,
    });

    // Store consumer for later use
    this.consumers.set(consumer.id, consumer);
    return consumer;
  }
}
