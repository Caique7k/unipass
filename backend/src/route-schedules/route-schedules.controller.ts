import {
  UseGuards,
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Delete,
  Query,
  Req,
} from '@nestjs/common';
import { RouteSchedulesService } from './route-schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { IdListDto } from 'src/common/dto/id-list.dto';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { FindSchedulesDto } from './dto/find-schedules.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('route-schedules')
export class RouteSchedulesController {
  constructor(private readonly service: RouteSchedulesService) {}

  @Post()
  @Roles('ADMIN')
  create(@Req() req: any, @Body() dto: CreateScheduleDto) {
    return this.service.create(req.user.companyId, dto);
  }

  @Get(':routeId')
  @Roles('ADMIN', 'DRIVER', 'COORDINATOR')
  findByRoute(
    @Req() req: any,
    @Param('routeId', new ParseUUIDPipe()) routeId: string,
    @Query() query: FindSchedulesDto,
  ) {
    return this.service.findByRoute({
      companyId: req.user.companyId,
      routeId,
      page: query.page,
      limit: query.limit,
      search: query.search,
      active: query.active,
    });
  }

  @Patch('deactivate')
  @Roles('ADMIN')
  deactivateMany(@Req() req: any, @Body() dto: IdListDto) {
    return this.service.deactivateMany(req.user.companyId, dto.ids);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(
    @Req() req: any,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateScheduleDto,
  ) {
    return this.service.update(req.user.companyId, id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Req() req: any, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.remove(req.user.companyId, id);
  }
}
