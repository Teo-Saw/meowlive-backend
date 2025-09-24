import { Injectable, Logger } from '@nestjs/common';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class StreamService {
  private readonly logger = new Logger(StreamService.name);
  private processes: Map<string, ChildProcessWithoutNullStreams> = new Map();

  private outputDir = '/opt/homebrew/var/www/hls';

  startStream(streamKey: string) {

    if (!streamKey) {
      throw new Error('streamKey is required');
    }

    const outputPath = path.join(this.outputDir, streamKey);
    this.logger.log(`this is output path + ${outputPath}` );
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    const ffmpeg = spawn('ffmpeg', [
      '-i', 'pipe:0',                      // input stream (stdin)
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-tune', 'zerolatency',
      '-g', '30',                          // GOP = 1s at 30fps
      '-keyint_min', '30',                 // enforce keyframe every 30 frames
      '-sc_threshold', '0',                // disable scene-cut changing GOP
      '-c:a', 'aac',
      '-ar', '44100',
      '-b:a', '128k',
      '-f', 'hls',
      '-hls_time', '1',                    // 1-second segments
      '-hls_list_size', '4',               // keep only 4 segments (~4s latency)
      '-hls_flags', 'delete_segments+append_list+split_by_time',
      '-hls_segment_type', 'mpegts',       // standard transport stream segments
      '-hls_playlist_type', 'event',       // allow near-live playback
      '-master_pl_name', 'master.m3u8',
      `${outputPath}/index.m3u8`,
    ]);

    ffmpeg.stderr.on('data', (data) => {
      this.logger.log(`[FFmpeg ${streamKey}]: ${data}`);
    });

    ffmpeg.on('close', (code) => {
      this.logger.log(`FFmpeg for ${streamKey} exited with code ${code}`);
      this.processes.delete(streamKey);
    });

    this.processes.set(streamKey, ffmpeg);
  }

  writeChunk(streamKey: string, chunk: Buffer, source?: NodeJS.ReadableStream) {
  const ffmpeg = this.processes.get(streamKey);
  if(ffmpeg) 
  {
    const ok = ffmpeg.stdin.write(chunk);
    if (!ok && source) 
    {
      // pause the incoming stream until ffmpeg is ready
      source.pause()

      ffmpeg.stdin.once('drain', () => {
        source.resume();
      })  
    }
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
