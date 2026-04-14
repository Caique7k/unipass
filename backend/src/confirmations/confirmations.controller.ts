import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ConfirmationsService } from './confirmations.service';
import { ConfirmScheduleDto } from './dto/confirm-schedule.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('confirmations')
export class ConfirmationsController {
  constructor(private service: ConfirmationsService) {}

  @Post()
  confirm(@Req() req, @Body() dto: ConfirmScheduleDto) {
    return this.service.confirm(
      req.user.id,
      dto.scheduleId,
      dto.willGo,
      dto.occurrenceKey,
    );
  }
}
