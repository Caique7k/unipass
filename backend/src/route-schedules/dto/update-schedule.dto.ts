import { IsOptional, IsEnum, IsInt, IsUUID, IsBoolean } from 'class-validator';
import { ScheduleType } from './create-schedule.dto';

export class UpdateScheduleDto {
  @IsOptional()
  @IsUUID()
  busId?: string;

  @IsOptional()
  @IsEnum(ScheduleType)
  type?: ScheduleType;

  @IsOptional()
  @IsInt()
  departureTime?: number;

  @IsOptional()
  @IsInt()
  dayOfWeek?: number;

  @IsOptional()
  @IsInt()
  notifyBeforeMinutes?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
