import { IsString, IsNotEmpty } from 'class-validator';

export class SendAiMessageDto {
  @IsString()
  @IsNotEmpty()
  playerId: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}
