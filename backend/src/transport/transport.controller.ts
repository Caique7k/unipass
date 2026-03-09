import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { TransportService } from './transport.service';
import { JwtAuthGuard } from 'src/auth/dto/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { BoardingDto } from './dto/boarding.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('transport')
export class TransportController {
  constructor(private readonly transportService: TransportService) {}
  @Roles('DRIVER', 'ADMIN')
  @Post('boarding')
  register(@Body() dto: BoardingDto) {
    return this.transportService.registerBoarding(dto);
  }
}
