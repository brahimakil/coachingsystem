import { IsString, IsIn, IsDateString } from 'class-validator';

export class CreateSubscriptionDto {
  @IsString()
  playerId: string;

  @IsString()
  coachId: string;

  @IsIn(['active', 'pending', 'rejected', 'stopped'])
  status: 'active' | 'pending' | 'rejected' | 'stopped';

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}
