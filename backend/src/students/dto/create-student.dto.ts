import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateStudentDto {
  @IsString()
  name: string;

  @IsString()
  registration: string;

  @IsString()
  groupId: string;

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
}
