import { IsEnum, IsOptional, IsString, IsArray, IsNumber, Min, Max } from 'class-validator';
import { CoachStatus } from './create-coach.dto';
import { Transform } from 'class-transformer';

export class UpdateCoachDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  profession?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => {
    const num = Number(value);
    return isNaN(num) ? value : num;
  })
  pricePerSession?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  @IsArray()
  @IsString({ each: true })
  availableDays?: string[];

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  availableHours?: Record<string, { start: string; end: string }[]>;

  @IsOptional()
  @IsEnum(CoachStatus)
  status?: CoachStatus;
}
