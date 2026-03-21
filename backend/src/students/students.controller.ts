import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Req,
  Query,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { StudentsService } from './students.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  findAll(@Req() req: any, @Query('search') search?: string) {
    return this.studentsService.findAll(req.user.companyId, search);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.studentsService.findOne(req.user.companyId, id);
  }

  @Post()
  create(@Req() req: any, @Body() dto: any) {
    return this.studentsService.create(req.user.companyId, dto);
  }

  @Put(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.studentsService.update(req.user.companyId, id, dto);
  }

  @Delete()
  deleteMany(@Body() body: { ids: string[] }) {
    return this.studentsService.deleteMany(body.ids);
  }

  @Patch('desactivate')
  desactivateMany(@Body() body: { ids: string[] }) {
    return this.studentsService.desactivateMany(body.ids);
  }
}
