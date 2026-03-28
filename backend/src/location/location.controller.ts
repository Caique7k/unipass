import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { DeviceTelemetryDto } from './dto/device-telemetry.dto';
import { LocationService } from './location.service';

@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post('telemetry')
  postTelemetry(@Body() dto: DeviceTelemetryDto) {
    return this.locationService.updateDeviceTelemetry(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('buses/:busId/live')
  @Roles('ADMIN', 'DRIVER', 'COORDINATOR')
  getLiveBusLocation(@Req() req: any, @Param('busId') busId: string) {
    return this.locationService.getLiveBusLocation(req.user.companyId, busId);
  }
}
