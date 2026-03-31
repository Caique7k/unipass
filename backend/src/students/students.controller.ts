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
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @Roles('ADMIN', 'DRIVER', 'COORDINATOR')
  findAll(
    @Req() req: any,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
    @Query('active') active?: string,
  ) {
    return this.studentsService.findAll({
      companyId: req.user.companyId,
      page: Number(page),
      limit: Number(limit),
      search,
      active: active === undefined ? undefined : active === 'true',
    });
  }

  @Get('user-candidates/list')
  @Roles('ADMIN')
  findUserCandidates(
    @Req() req: any,
    @Query('includeUserId') includeUserId?: string,
  ) {
    return this.studentsService.findUserCandidates(
      req.user.companyId,
      includeUserId,
    );
  }

  @Get(':id')
  @Roles('ADMIN', 'DRIVER', 'COORDINATOR')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.studentsService.findOne(req.user.companyId, id);
  }

  @Post()
  @Roles('ADMIN')
  create(@Req() req: any, @Body() dto: any) {
    return this.studentsService.create(req.user.companyId, dto);
  }

  @Put(':id')
  @Roles('ADMIN')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.studentsService.update(req.user.companyId, id, dto);
  }

  @Delete()
  @Roles('ADMIN')
  deleteMany(@Req() req: any, @Body() body: { ids: string[] }) {
    return this.studentsService.deleteMany(req.user.companyId, body.ids);
  }

  @Patch('desactivate')
  @Roles('ADMIN')
  desactivateMany(@Req() req: any, @Body() body: { ids: string[] }) {
    return this.studentsService.desactivateMany(req.user.companyId, body.ids);
  }
}
