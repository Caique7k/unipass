import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
  Patch,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DeleteDevicesDto } from './dto/delete-devices.dto';
import { LinkDeviceDto } from './dto/link-device.dto';
import { DevicesService } from './devices.service';
import { ListDevicesDto } from './dto/find-devices.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { LinkDeviceBusDto } from './dto/link-device-bus.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';

@Controller('devices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DevicesController {
  constructor(private readonly service: DevicesService) {}

  @Post('link')
  @Roles('ADMIN')
  link(@Req() req, @Body() dto: LinkDeviceDto) {
    return this.service.linkDevice(req.user, dto);
  }

  @Get()
  @Roles('ADMIN', 'DRIVER', 'COORDINATOR')
  findAll(@Req() req, @Query() query: ListDevicesDto) {
    return this.service.findAll(req.user, query);
  }

  @Delete()
  @Roles('ADMIN')
  deleteMany(@Req() req, @Body() dto: DeleteDevicesDto) {
    return this.service.deleteMany(req.user, dto);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(
    @Req() req,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateDeviceDto,
  ) {
    return this.service.update(req.user, id, dto);
  }

  @Patch(':id/bus')
  @Roles('ADMIN')
  linkBus(
    @Req() req,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: LinkDeviceBusDto,
  ) {
    return this.service.linkBus(req.user, id, dto);
  }
}
