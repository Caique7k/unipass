import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateStudentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  registration?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
