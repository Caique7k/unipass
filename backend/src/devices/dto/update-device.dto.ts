import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateDeviceDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name?: string;
}
