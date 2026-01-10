import { IsNotEmpty, IsString, IsNumber, Min, Max, IsOptional } from 'class-validator';

export class CreateRatingDto {
  @IsNotEmpty()
  @IsString()
  coachId: string;

  @IsNotEmpty()
  @IsString()
  playerId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  review?: string;

  @IsOptional()
  @IsString()
  playerName?: string;
}
