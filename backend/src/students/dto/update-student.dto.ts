import { IsString, IsOptional, IsBoolean, IsEmail } from 'class-validator';

export class UpdateStudentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
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
