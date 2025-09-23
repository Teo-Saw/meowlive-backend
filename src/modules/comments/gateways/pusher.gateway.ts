import { Injectable } from '@nestjs/common';
import Pusher from 'pusher';

@Injectable()
export class PusherService {
  private pusher: Pusher;

  constructor() {
    this.pusher = new Pusher({
      appId: '2052356',
      key: '493862fdde0c9e0998b2',
      secret: '506a1e8b514b70612bb7',
      cluster: 'ap1',
      useTLS: true,
    });
    // process.env.appId = 2052356
    // process.env.key = 493862fdde0c9e0998b2
    // process.env.secret = 506a1e8b514b70612bb7
    // process.env.cluster = ap1
  }

  async trigger(channel: string, event: string, data: any) {
    try {
      await this.pusher.trigger(channel, event, data);
    } catch (error) {
      // Handle error appropriately, e.g., log it
      console.error('Pusher trigger error:', error);
    }
  }
}
