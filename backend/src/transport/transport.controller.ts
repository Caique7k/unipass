import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { TransportService } from './transport.service';
import { JwtAuthGuard } from 'src/auth/dto/jwt-auth.guard';
import { BoardingDto } from './dto/boarding.dto';

@UseGuards(JwtAuthGuard)
@Controller('transport')
export class TransportController {
  constructor(private readonly transportService: TransportService) {}
  @UseGuards(JwtAuthGuard)
  @Post('boarding')
  register(@Body() dto: BoardingDto) {
    return this.transportService.registerBoarding(dto);
  }
}
