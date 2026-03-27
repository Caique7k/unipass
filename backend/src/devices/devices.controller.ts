import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateDeviceDto } from './dto/create-device.dto';
import { DeleteDevicesDto } from './dto/delete-devices.dto';

import { LinkDeviceDto } from './dto/link-device.dto';
import { DevicesService } from './devices.service';
import { ListDevicesDto } from './dto/find-devices.dto';

@Controller('devices')
@UseGuards(JwtAuthGuard)
export class DevicesController {
  constructor(private readonly service: DevicesService) {}

  @Post()
  create(@Body() dto: CreateDeviceDto) {
    return this.service.create(dto);
  }

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
}
