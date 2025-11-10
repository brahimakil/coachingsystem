import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';

export enum PlayerStatus {
  ACTIVE = 'active',
  PENDING = 'pending_activation',
  REJECTED = 'rejected',
}

export class CreatePlayerDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  dateOfBirth: string;

  @IsOptional()
  @IsEnum(PlayerStatus)
  status?: PlayerStatus;
}
