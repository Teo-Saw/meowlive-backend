import { Controller, Post, Body } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('mediasoup')
@Controller('stream')
export class StreamController {

@Post('start-stream')
@ApiOperation({ summary: 'Get Stream Key' })
@ApiResponse({ status: 200, description: 'Return Stream Key' })

    startStream() {
    const streamKey = uuidv4();
    return { streamKey };
    }
}
