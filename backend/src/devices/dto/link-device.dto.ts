import { IsString, IsNotEmpty } from 'class-validator';

export class LinkDeviceDto {
  @IsString()
  @IsNotEmpty()
  pairingCode: string;

  @IsString()
  @IsNotEmpty()
  busId: string;
}
