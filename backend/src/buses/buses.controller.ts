import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Req,
} from '@nestjs/common';
import { BusesService } from './buses.service';
import { CreateBusDto } from './dto/create-bus.dto';
import { UpdateBusDto } from './dto/update-bus.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('buses')
export class BusesController {
  constructor(private readonly busesService: BusesService) {}

  @Post()
  create(@Req() req, @Body() dto: CreateBusDto) {
    return this.busesService.create(req.user.companyId, dto);
  }

  @Get()
  findAll(@Req() req) {
    return this.busesService.findAll(req.user.companyId);
  }

  @Get(':id')
  findOne(@Req() req, @Param('id') id: string) {
    return this.busesService.findOne(req.user.companyId, id);
  }

  @Put(':id')
  update(@Req() req, @Param('id') id: string, @Body() dto: UpdateBusDto) {
    return this.busesService.update(req.user.companyId, id, dto);
  }

  @Delete(':id')
  remove(@Req() req, @Param('id') id: string) {
    return this.busesService.remove(req.user.companyId, id);
  }
}
