import { Controller, Post, Body, Get, Req } from '@nestjs/common';
import { RoutesService } from './routes.service';
import { CreateRouteDto } from './dto/create-route.dto';

@Controller('routes')
export class RoutesController {
  constructor(private service: RoutesService) {}

  @Post()
  create(@Req() req, @Body() dto: CreateRouteDto) {
    return this.service.create(req.user.companyId, dto);
  }

  @Get()
  findAll(@Req() req) {
    return this.service.findAll(req.user.companyId);
  }
}
