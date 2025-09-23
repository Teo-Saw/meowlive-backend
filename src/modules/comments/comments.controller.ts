import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PusherService } from './gateways/pusher.gateway';
import { CreateUserDto } from './dto';

interface User {
  id: number;
  name: string;
}

@ApiTags('users')
@Controller('users')
export class UsersController {
  private users: User[] = [
    { id: 1, name: 'Hello! Welcome Back' },
    { id: 2, name: 'See you again!' },
  ];

  constructor(private readonly pusherService: PusherService) {}

  @Get()
  @ApiOperation({ summary: 'Get Comments users' })
  @ApiResponse({ status: 200, description: 'Return all users.' })
  getUsers(): User[] {
    console.log('GET /users called');
    return this.users;
  }

  @Post()
  @ApiOperation({ summary: 'Create a new comment' })
  @ApiResponse({
    status: 201,
    description: 'The comment has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  async createUser(@Body() createUserDto: CreateUserDto): Promise<User> {
    console.log('POST /users called with:', createUserDto);
    const newUser: User = {
      id: this.users.length + 1,
      name: createUserDto.name,
    };
    this.users.push(newUser);
    // Trigger Pusher event using your existing service
    await this.pusherService.trigger('users-channel', 'user-added', newUser);
    return newUser;
  }
}
