import { ApiProperty } from '@nestjs/swagger';
import type {
  RtpCodecParameters,
  RtpCapabilities,
} from 'node_modules/mediasoup/node/lib/types';

export type RtpParameters = {
  mid?: string;
  codecs: RtpCodecParameters[];
  headerExtensions?: any[];
  encodings?: any[];
  rtcp?: any;
};

export class ProduceDto {
  @ApiProperty({ example: 'transport-id-123' })
  transportId: string;

  @ApiProperty({ example: 'video', enum: ['audio', 'video'] })
  kind: 'audio' | 'video';

  @ApiProperty({ example: { codecs: [], encodings: [] }, description: 'RTP parameters from frontend' })
  rtpParameters: RtpParameters;
}

export class ConsumeDto {
  @ApiProperty({ example: 'transport-id-123' })
  transportId: string;

  @ApiProperty({ example: 'producer-id-456' })
  producerId: string;

  @ApiProperty({ example: { codecs: [], headerExtensions: [] }, description: 'RTP capabilities from frontend' })
  rtpCapabilities: RtpCapabilities;
}
