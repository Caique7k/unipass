import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { InternalApiKeyGuard } from 'src/auth/internal-api-key.guard';
import { Public } from 'src/auth/public.decorator';
import { TransportService } from './transport.service';
import { IotBoardingDto } from './dto/iot-boarding.dto';

@Public()
@UseGuards(InternalApiKeyGuard)
@Controller('iot/transport')
@Throttle({
  default: {
    limit: 1200,
    ttl: 60_000,
  },
})
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
