import { Injectable } from '@nestjs/common';
import { PusherService } from './gateways/pusher.gateway';

@Injectable()
export class UsersService {
  private users: { id: number; name: string }[] = [];
  private nextId = 1;

  constructor(private pusherService: PusherService) {}

  findAll() {
    return this.users;
  }

  async addUser(user: { name: string }) {
    const newUser = { id: this.nextId++, name: user.name };
    this.users.push(newUser);

    // Trigger real-time event
    await this.pusherService.trigger('users-channel', 'user-added', newUser);

    return newUser;
  }
}
