import { IsUUID, IsBoolean, IsOptional, Matches } from 'class-validator';

export class ConfirmScheduleDto {
  @IsUUID()
  scheduleId: string;

  @IsBoolean()
  willGo: boolean;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  occurrenceKey?: string;
}
