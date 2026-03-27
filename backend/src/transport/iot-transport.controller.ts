import { Body, Controller, Post } from '@nestjs/common';
import { TransportService } from './transport.service';
import { IotBoardingDto } from './dto/iot-boarding.dto';

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
