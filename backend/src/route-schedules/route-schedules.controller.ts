import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { RouteSchedulesService } from './route-schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

@Controller('route-schedules')
export class RouteSchedulesController {
  constructor(private service: RouteSchedulesService) {}

  @Post()
  create(@Body() dto: CreateScheduleDto) {
    return this.service.create(dto);
  }

  @Get(':routeId')
  findByRoute(@Param('routeId') routeId: string) {
    return this.service.findByRoute(routeId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateScheduleDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
