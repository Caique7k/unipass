import { IsBooleanString, IsNumberString, IsOptional, IsString } from 'class-validator';

export class FindGroupsDto {
  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBooleanString()
  active?: string;
}
