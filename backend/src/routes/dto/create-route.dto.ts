import { IsString, IsOptional } from 'class-validator';

export class CreateRouteDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
