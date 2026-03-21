import { IsString } from 'class-validator';

export class LinkRfidDto {
  @IsString()
  studentId: string;

  @IsString()
  rfidTag: string;
}
