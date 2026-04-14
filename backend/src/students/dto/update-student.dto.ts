import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateStudentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  groupId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  routeIds?: string[];

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  registration?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
