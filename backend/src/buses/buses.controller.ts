import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
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

@UseGuards(JwtAuthGuard)
@Controller('buses')
export class BusesController {
  constructor(private readonly busesService: BusesService) {}

  @Post()
  create(@Req() req, @Body() dto: CreateBusDto) {
    return this.busesService.create(req.user.companyId, dto);
  }

  @Get()
  findAll(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search') search: string,
    @Req() req: any,
  ) {
    return this.busesService.findAll({
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      search,
      companyId: req.user.companyId,
    });
  }

  @Get(':id')
  findOne(@Req() req, @Param('id') id: string) {
    return this.busesService.findOne(req.user.companyId, id);
  }

  @Put(':id')
  update(@Req() req, @Param('id') id: string, @Body() dto: UpdateBusDto) {
    return this.busesService.update(req.user.companyId, id, dto);
  }

  @Delete()
  deleteMany(@Body() body: { ids: string[] }) {
    return this.busesService.deleteMany(body.ids);
  }
}
