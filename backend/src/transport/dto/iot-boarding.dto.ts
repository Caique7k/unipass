import { IsNotEmpty, IsString } from 'class-validator';

export class IotBoardingDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  secret: string;

  @IsString()
  @IsNotEmpty()
  rfidTag: string;
}
