import { IsString, IsOptional, IsBoolean, IsEmail } from 'class-validator';

export class CreateStudentDto {
  @IsString()
  name: string;

  @IsString()
  registration: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
