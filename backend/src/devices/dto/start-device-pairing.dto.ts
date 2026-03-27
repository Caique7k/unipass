import { IsNotEmpty, IsString } from 'class-validator';

export class StartDevicePairingDto {
  @IsString()
  @IsNotEmpty()
  hardwareId: string;
}
