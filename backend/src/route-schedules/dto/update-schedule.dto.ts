import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { ScheduleType } from './create-schedule.dto';

export class UpdateScheduleDto {
  @IsOptional()
  @IsUUID()
  busId?: string | null;

  @IsOptional()
  @IsEnum(ScheduleType)
  type?: ScheduleType;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsInt()
  departureTime?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number | null;

  @IsOptional()
  @IsInt()
  notifyBeforeMinutes?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
