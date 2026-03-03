import { IsString } from 'class-validator';

export class BoardingDto {
  @IsString()
  deviceIdentifier: string;

  @IsString()
  rfidTag: string;
}
