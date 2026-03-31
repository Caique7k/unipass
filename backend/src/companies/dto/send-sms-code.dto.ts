import { IsString, MinLength } from 'class-validator';

export class SendSmsCodeDto {
  @IsString()
  @MinLength(8)
  phone: string;
}
