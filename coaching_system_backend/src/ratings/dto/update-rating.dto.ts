import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';

export class UpdateRatingDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  review?: string;
}
