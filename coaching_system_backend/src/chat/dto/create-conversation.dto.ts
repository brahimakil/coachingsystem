import { IsString, IsNotEmpty } from 'class-validator';

export class CreateConversationDto {
  @IsString()
  @IsNotEmpty()
  coachId: string;

  @IsString()
  @IsNotEmpty()
  playerId: string;
}
