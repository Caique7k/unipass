import { IsUUID } from 'class-validator';

export class LinkDeviceBusDto {
  @IsUUID('4')
  busId: string;
}
