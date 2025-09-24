/* eslint-disable @typescript-eslint/no-unused-vars */
import { Controller, Post, Body, Get, Query, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { userDto } from './dto';

@ApiTags('stream')
@Controller('stream')
export class StreamController {

    private streamKeys: Map<number, string> = new Map<number, string>();

    @Post('start-stream')
    @ApiOperation({ summary: 'Get Stream Key' })
    @ApiResponse({ status: 200, description: 'Return Stream Key' })

    startStream(@Body() body: userDto) {
    const streamKey = uuidv4();
    this.streamKeys.set((body.userId), streamKey);

    // TODO: save to DB in the future
    // body.userId is available here
    // createdAt = new Date() & Time()
    
    return { streamKey };
    }

    @Get('get-stream')
    @ApiOperation({ summary: 'Give Stream Key' })
    @ApiResponse({ status: 200, description: 'Return Stream Key' })

    getStream(@Query('userId') userId: string): { streamKey: string } {
    const id = Number(userId);
    const streamKey = this.streamKeys.get(id);
        if (!streamKey) {
            throw new NotFoundException('No stream key found for this user');
        }
        return { streamKey };
    }
}