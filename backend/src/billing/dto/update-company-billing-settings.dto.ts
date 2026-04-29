import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateCompanyBillingSettingsDto {
  @IsOptional()
  @IsBoolean()
  usePlatformGateway?: boolean;

  @IsOptional()
  @IsString()
  gatewayContactName?: string;

  @IsOptional()
  @IsEmail()
  gatewayContactEmail?: string;

  @IsOptional()
  @IsString()
  gatewayContactPhone?: string;

  @IsOptional()
  @IsString()
  legalEntityName?: string;

  @IsOptional()
  @IsString()
  legalDocument?: string;

  @IsOptional()
  @IsString()
  bankInfoSummary?: string;

  @IsOptional()
  @IsInt()
  @Min(100)
  defaultAmountCents?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  defaultDueDay?: number | null;

  @IsOptional()
  @IsBoolean()
  lgpdAccepted?: boolean;

  @IsOptional()
  @IsBoolean()
  platformTermsAccepted?: boolean;
}
