import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export enum ScheduleType {
  GO = 'GO',
  BACK = 'BACK',
  SHIFT = 'SHIFT',
}

export class CreateScheduleDto {
  @IsUUID()
  routeId: string;

  @IsOptional()
  @IsUUID()
  busId?: string | null;

  @IsEnum(ScheduleType)
  type: ScheduleType;

  @IsOptional()
  @IsString()
  title?: string;

  @IsInt()
  departureTime: number; // timestamp (ou muda depois)

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number | null;

  @IsOptional()
  @IsInt()
  notifyBeforeMinutes?: number;
}
