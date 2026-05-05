import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseUUIDPipe,
  Put,
  Req,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BusesService } from './buses.service';
import { CreateBusDto } from './dto/create-bus.dto';
import { UpdateBusDto } from './dto/update-bus.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { FindBusesDto } from './dto/find-buses.dto';
import { DeleteBusesDto } from './dto/delete-buses.dto';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('buses')
export class BusesController {
  constructor(private readonly busesService: BusesService) {}

  @Post()
  @Roles('ADMIN')
  create(@Req() req, @Body() dto: CreateBusDto) {
    return this.busesService.create(req.user.companyId, dto);
  }

  @Get()
  @Roles('ADMIN', 'DRIVER', 'COORDINATOR')
  findAll(@Query() query: FindBusesDto, @Req() req: any) {
    return this.busesService.findAll({
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      search: query.search,
      companyId: req.user.companyId,
    });
  }

  @Get(':id')
  @Roles('ADMIN', 'DRIVER', 'COORDINATOR')
  findOne(@Req() req, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.busesService.findOne(req.user.companyId, id);
  }

  @Put(':id')
  @Roles('ADMIN')
  update(
    @Req() req,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateBusDto,
  ) {
    return this.busesService.update(req.user.companyId, id, dto);
  }

  @Delete()
  @Roles('ADMIN')
  deleteMany(@Req() req: any, @Body() dto: DeleteBusesDto) {
    return this.busesService.deleteMany(req.user.companyId, dto.ids);
  }
}
