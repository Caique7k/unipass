import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateStudentDto {
  @IsString()
  name: string;

  @IsString()
  registration: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
