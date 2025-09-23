import { Module } from '@nestjs/common';
import { UsersController } from './comments.controller';
import { UsersService } from './comments.service';
import { PusherService } from './gateways/pusher.gateway';

@Module({
  imports: [],
  controllers: [UsersController],
  providers: [UsersService, PusherService],
})
export class UsersModule {}
