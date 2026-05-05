import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class LinkDeviceDto {
  @IsString()
  @IsNotEmpty()
  pairingCode: string;

  @IsUUID('4')
  busId: string;
}
