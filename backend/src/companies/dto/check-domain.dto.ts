import { IsString, MinLength } from 'class-validator';

export class CheckDomainDto {
  @IsString()
  @MinLength(3)
  domain: string;
}
