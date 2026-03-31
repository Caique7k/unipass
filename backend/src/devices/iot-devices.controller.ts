import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { InternalApiKeyGuard } from 'src/auth/internal-api-key.guard';
import { ClaimDevicePairingDto } from './dto/claim-device-pairing.dto';
import { StartDevicePairingDto } from './dto/start-device-pairing.dto';
import { DevicesService } from './devices.service';

@UseGuards(InternalApiKeyGuard)
@Controller('iot/devices')
export class IotDevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post('pairing/start')
  startPairing(@Body() dto: StartDevicePairingDto) {
    return this.devicesService.startPairing(dto);
  }

  @Post('pairing/claim')
  claimPairing(@Body() dto: ClaimDevicePairingDto) {
    return this.devicesService.claimPairing(dto);
  }
}
