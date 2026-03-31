import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { InternalApiKeyGuard } from 'src/auth/internal-api-key.guard';
import { TransportService } from './transport.service';
import { IotBoardingDto } from './dto/iot-boarding.dto';

@UseGuards(InternalApiKeyGuard)
@Controller('iot/transport')
export class IotTransportController {
  constructor(private readonly transportService: TransportService) {}

  @Post('boarding')
  registerBoarding(@Body() dto: IotBoardingDto) {
    return this.transportService.registerIotBoarding(dto);
  }

  @Post('deboarding')
  registerDeboarding(@Body() dto: IotBoardingDto) {
    return this.transportService.registerIotDeboarding(dto);
  }
}
