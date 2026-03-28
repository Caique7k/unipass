import { IsNumber, IsString } from 'class-validator';

export class DeviceTelemetryDto {
  @IsString()
  code: string;

  @IsString()
  secret: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
}
