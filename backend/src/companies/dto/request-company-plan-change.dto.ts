import { CompanyPlan } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class RequestCompanyPlanChangeDto {
  @IsEnum(CompanyPlan)
  plan: CompanyPlan;
}
