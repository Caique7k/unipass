import { BillingTemplateRecurrence } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateBillingTemplateDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  amountCents: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(31)
  dueDay: number;

  @IsOptional()
  @IsEnum(BillingTemplateRecurrence)
  recurrence?: BillingTemplateRecurrence;

  @IsOptional()
  @IsBoolean()
  notifyOnGeneration?: boolean;
}
