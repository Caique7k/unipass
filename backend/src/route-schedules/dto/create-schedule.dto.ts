import { Transform, Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export enum ScheduleType {
  GO = 'GO',
  BACK = 'BACK',
  SHIFT = 'SHIFT',
}

const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateScheduleDto {
  @IsUUID()
  routeId: string;

  @IsOptional()
  @IsUUID()
  busId?: string | null;

  @IsEnum(ScheduleType)
  type: ScheduleType;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(120)
  title?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(86_399_999)
  departureTime: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number | null;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  dayOfWeeks?: number[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_439)
  notifyBeforeMinutes?: number;
}
