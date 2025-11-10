import { IsString, IsIn, IsDateString, IsOptional } from 'class-validator';

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsString()
  playerId?: string;

  @IsOptional()
  @IsString()
  coachId?: string;

  @IsOptional()
  @IsIn(['active', 'pending', 'rejected', 'stopped'])
  status?: 'active' | 'pending' | 'rejected' | 'stopped';

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
