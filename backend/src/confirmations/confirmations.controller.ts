import { Controller, Post, Body, Req } from '@nestjs/common';
import { ConfirmationsService } from './confirmations.service';
import { ConfirmScheduleDto } from './dto/confirm-schedule.dto';

@Controller('confirmations')
export class ConfirmationsController {
  constructor(private service: ConfirmationsService) {}

  @Post()
  confirm(@Req() req, @Body() dto: ConfirmScheduleDto) {
    return this.service.confirm(req.user.id, dto.scheduleId, dto.willGo);
  }
}
