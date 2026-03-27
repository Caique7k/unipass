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
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DeleteDevicesDto } from './dto/delete-devices.dto';
import { LinkDeviceDto } from './dto/link-device.dto';
import { DevicesService } from './devices.service';
import { ListDevicesDto } from './dto/find-devices.dto';

@Controller('devices')
@UseGuards(JwtAuthGuard)
export class DevicesController {
  constructor(private readonly service: DevicesService) {}

  @Post('link')
  link(@Req() req, @Body() dto: LinkDeviceDto) {
    return this.service.linkDevice(req.user, dto);
  }

  @Get()
  findAll(@Req() req, @Query() query: ListDevicesDto) {
    return this.service.findAll(req.user, query);
  }

  @Delete()
  deleteMany(@Req() req, @Body() dto: DeleteDevicesDto) {
    return this.service.deleteMany(req.user, dto);
  }

  @Patch(':id')
  update(@Req() req, @Param('id') id: string, @Body() dto: { name: string }) {
    return this.service.update(req.user, id, dto);
  }

  @Patch(':id/bus')
  linkBus(@Req() req, @Param('id') id: string, @Body() dto: { busId: string }) {
    return this.service.linkBus(req.user, id, dto);
  }
}
