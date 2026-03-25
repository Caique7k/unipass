import { IsInt, IsNotEmpty, Matches, Min } from 'class-validator';

export class CreateBusDto {
  @IsNotEmpty()
  @Matches(/^[A-Z]{3}[0-9][A-Z][0-9]{2}$/, {
    message: 'Placa inválida (formato Mercosul)',
  })
  plate: string;

  @IsInt()
  @Min(1)
  capacity: number;
}
