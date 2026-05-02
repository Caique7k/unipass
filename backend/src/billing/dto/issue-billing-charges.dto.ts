import { Transform } from 'class-transformer';
import { IsOptional, IsString, Matches } from 'class-validator';

const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class IssueBillingChargesDto {
  @IsOptional()
  @Transform(trimString)
  @IsString()
  templateId?: string;

  @Transform(trimString)
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  referenceMonth: string;

  @Transform(trimString)
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  issueDate: string;
}
