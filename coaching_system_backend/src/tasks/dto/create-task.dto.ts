import { IsString, IsIn, IsDateString, IsOptional, IsObject } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  coachId: string;

  @IsString()
  playerId: string;

  @IsString()
  subscriptionId: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsIn(['pending', 'completed', 'cancelled'])
  status: 'pending' | 'completed' | 'cancelled';

  @IsDateString()
  startDate: string;

  @IsDateString()
  dueDate: string;

  @IsOptional()
  @IsObject()
  submission?: {
    textResponse?: string;
    mediaUrls?: string[];
    submittedAt?: string;
    status: 'not_submitted' | 'submitted' | 'approved' | 'rejected';
  };
}
