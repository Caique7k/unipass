import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateCompanyProfileDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsString()
  @MinLength(11)
  cnpj: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  contactName?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  contactPhone?: string;
}
