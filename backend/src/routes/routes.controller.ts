import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RoutesService } from './routes.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { IdListDto } from 'src/common/dto/id-list.dto';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { FindRoutesDto } from './dto/find-routes.dto';
import { UpdateRouteDto } from './dto/update-route.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('routes')
export class RoutesController {
  constructor(private readonly service: RoutesService) {}

  @Post()
  @Roles('ADMIN')
  create(@Req() req: any, @Body() dto: CreateRouteDto) {
    return this.service.create(req.user.companyId, dto);
  }

  @Get()
  @Roles('ADMIN', 'DRIVER', 'COORDINATOR')
  findAll(@Req() req: any, @Query() query: FindRoutesDto) {
    return this.service.findAll({
      companyId: req.user.companyId,
      page: query.page,
      limit: query.limit,
      search: query.search,
      active: query.active,
    });
  }

  @Get(':id')
  @Roles('ADMIN', 'DRIVER', 'COORDINATOR')
  findOne(@Req() req: any, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findOne(req.user.companyId, id);
  }

  @Put(':id')
  @Roles('ADMIN')
  update(
    @Req() req: any,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateRouteDto,
  ) {
    return this.service.update(req.user.companyId, id, dto);
  }

  @Patch('deactivate')
  @Roles('ADMIN')
  deactivateMany(@Req() req: any, @Body() dto: IdListDto) {
    return this.service.deactivateMany(req.user.companyId, dto.ids);
  }
}
