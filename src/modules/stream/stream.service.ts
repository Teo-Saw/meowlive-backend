import { Injectable, Logger } from '@nestjs/common';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class StreamService {
  private readonly logger = new Logger(StreamService.name);
  private processes: Map<string, ChildProcessWithoutNullStreams> = new Map();

  // private outputDir = '/opt/homebrew/var/www/hls/${streamKey}';
  private outputDir = '/opt/homebrew/var/www/hls';

  startStream(streamKey: string) {
    const outputPath = path.join(this.outputDir, streamKey);
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    const ffmpeg = spawn('ffmpeg', [
      '-i', 'pipe:0',              // input from stdin
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-tune', 'zerolatency',
      '-c:a', 'aac',
      '-f', 'hls',
      '-hls_time', '2',
      '-hls_list_size', '5',
      '-hls_flags', 'delete_segments+append_list',
      `${outputPath}/index.m3u8`,
    ]);

    this.logger.log('FFmpeg output path:', outputPath);

    ffmpeg.stderr.on('data', (data) => {
      this.logger.log(`[FFmpeg ${streamKey}]: ${data}`);
    });

    ffmpeg.on('close', (code) => {
      this.logger.log(`FFmpeg for ${streamKey} exited with code ${code}`);
      this.processes.delete(streamKey);
    });

    this.processes.set(streamKey, ffmpeg);
  }

  writeChunk(streamKey: string, chunk: Buffer) {
    const ffmpeg = this.processes.get(streamKey);
    if (ffmpeg) {
      ffmpeg.stdin.write(chunk);
    }
  }

  stopStream(streamKey: string) {
    const ffmpeg = this.processes.get(streamKey);
    if (ffmpeg) {
      ffmpeg.stdin.end();
      ffmpeg.kill('SIGINT');
      this.processes.delete(streamKey);
    }
  }
}
