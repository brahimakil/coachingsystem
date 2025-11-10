import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PlayerStatus } from './create-player.dto';

export class UpdatePlayerDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @IsOptional()
  @IsEnum(PlayerStatus)
  status?: PlayerStatus;
}
