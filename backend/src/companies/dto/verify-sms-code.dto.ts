import { IsString, Length, MinLength } from 'class-validator';

export class VerifySmsCodeDto {
  @IsString()
  @MinLength(8)
  phone: string;

  @IsString()
  @Length(6, 6)
  code: string;
}
