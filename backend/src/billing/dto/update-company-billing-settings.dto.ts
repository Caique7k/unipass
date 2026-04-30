import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const parseBoolean = ({ value }: { value: unknown }) => {
  if (value === 'true' || value === true) {
    return true;
  }

  if (value === 'false' || value === false) {
    return false;
  }

  return value;
};

const parseOptionalNumber = ({ value }: { value: unknown }) => {
  if (value === '' || value === undefined || value === null) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
  }

  return value;
};

export class UpdateCompanyBillingSettingsDto {
  @IsOptional()
  @Transform(parseBoolean)
  @IsBoolean()
  usePlatformGateway?: boolean;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  gatewayContactName?: string;

  @IsOptional()
  @Transform(trimString)
  @IsEmail()
  gatewayContactEmail?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  gatewayContactPhone?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  legalEntityName?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  legalDocument?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  bankInfoSummary?: string;

  @IsOptional()
  @Transform(parseOptionalNumber)
  @IsInt()
  @Min(100)
  defaultAmountCents?: number | null;

  @IsOptional()
  @Transform(parseOptionalNumber)
  @IsInt()
  @Min(1)
  @Max(31)
  defaultDueDay?: number | null;

  @IsOptional()
  @Transform(parseBoolean)
  @IsBoolean()
  lgpdAccepted?: boolean;

  @IsOptional()
  @Transform(parseBoolean)
  @IsBoolean()
  platformTermsAccepted?: boolean;
}
