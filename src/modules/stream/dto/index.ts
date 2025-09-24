import { IsNotEmpty, IsNumber } from 'class-validator';

export class userDto {
  @IsNotEmpty()
  @IsNumber()
  userId: number;
}