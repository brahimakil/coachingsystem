import { IsEmail, IsNotEmpty, IsString, IsEnum, IsArray, IsOptional, MinLength, IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export enum CoachStatus {
  ACTIVE = 'active',
  PENDING = 'pending_activation',
  REJECTED = 'rejected',
}

export class CreateCoachDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsNotEmpty()
  @IsString()
  dateOfBirth: string;

  @IsNotEmpty()
  @IsString()
  profession: string;

  @IsNumber()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => {
    const num = Number(value);
    return isNaN(num) ? value : num;
  })
  pricePerSession: number;

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
  availableDays: string[];

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
  @IsNotEmpty()
  availableHours: Record<string, { start: string; end: string }[]>;

  @IsEnum(CoachStatus)
  @IsOptional()
  status?: CoachStatus;
}
