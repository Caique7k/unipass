import { Body, Controller, Post } from '@nestjs/common';
import { ClaimDevicePairingDto } from './dto/claim-device-pairing.dto';
import { StartDevicePairingDto } from './dto/start-device-pairing.dto';
import { DevicesService } from './devices.service';

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
