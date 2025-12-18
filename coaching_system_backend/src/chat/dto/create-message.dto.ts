import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  senderId: string;

  @IsString()
  @IsNotEmpty()
  senderType: 'coach' | 'player';

  @IsString()
  @IsNotEmpty()
  text: string;

  @IsOptional()
  @IsString()
  mediaUrl?: string;
}
