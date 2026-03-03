import { Controller, Post, Body } from '@nestjs/common';
import { TransportService } from './transport.service';
import { BoardingDto } from './dto/boarding.dto';

@Controller('transport')
export class TransportController {
  constructor(private readonly transportService: TransportService) {}

  @Post('boarding')
  register(@Body() dto: BoardingDto) {
    return this.transportService.registerBoarding(dto);
  }
}
