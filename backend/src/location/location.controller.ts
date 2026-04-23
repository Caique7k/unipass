import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { InternalApiKeyGuard } from 'src/auth/internal-api-key.guard';
import { Public } from 'src/auth/public.decorator';
import { DeviceTelemetryDto } from './dto/device-telemetry.dto';
import { LocationService } from './location.service';

@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Public()
  @Post('telemetry')
  @UseGuards(InternalApiKeyGuard)
  @Throttle({
    default: {
      limit: 2400,
      ttl: 60_000,
    },
  })
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
