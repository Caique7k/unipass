import { IsUUID, IsEnum, IsInt, IsOptional, IsBoolean } from 'class-validator';

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
  busId?: string;

  @IsEnum(ScheduleType)
  type: ScheduleType;

  @IsInt()
  departureTime: number; // timestamp (ou muda depois)

  @IsOptional()
  @IsInt()
  dayOfWeek?: number;

  @IsOptional()
  @IsInt()
  notifyBeforeMinutes?: number;
}
