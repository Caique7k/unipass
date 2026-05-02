import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { StudentBillingCustomerDto } from './student-billing-customer.dto';

export class CreateStudentDto {
  @IsString()
  name: string;

  @IsString()
  registration: string;

  @IsString()
  groupId: string;

  @IsString()
  billingTemplateId: string;

  @IsArray()
  @IsString({ each: true })
  routeIds: string[];

  @IsOptional()
  @IsString()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsString()
  rfidTag?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => StudentBillingCustomerDto)
  billingCustomer?: StudentBillingCustomerDto;
}
