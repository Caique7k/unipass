import { IsNotEmpty, IsString } from 'class-validator';

export class ClaimDevicePairingDto {
  @IsString()
  @IsNotEmpty()
  hardwareId: string;

  @IsString()
  @IsNotEmpty()
  pairingCode: string;
}
