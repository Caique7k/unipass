import { CompanyPlan } from '@prisma/client';
import {
  IsEnum,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class CreateCompanyOnboardingDto {
  @IsString()
  @MinLength(3)
  companyName: string;

  @IsString()
  @MinLength(3)
  contactName: string;

  @IsString()
  @MinLength(8)
  phone: string;

  @IsString()
  @MinLength(11)
  cnpj: string;

  @IsString()
  @MinLength(3)
  domain: string;

  @IsEnum(CompanyPlan)
  plan: CompanyPlan;

  @IsString()
  @MinLength(3)
  adminName: string;

  @IsString()
  @Matches(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/)
  adminLogin: string;

  @IsString()
  @MinLength(6)
  password: string;
}
