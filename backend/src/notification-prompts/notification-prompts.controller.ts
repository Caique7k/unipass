import {
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  Body,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { NotificationPromptsService } from './notification-prompts.service';
import { RespondNotificationPromptDto } from './dto/respond-notification-prompt.dto';

@UseGuards(JwtAuthGuard)
@Controller('notification-prompts')
export class NotificationPromptsController {
  constructor(
    private readonly notificationPromptsService: NotificationPromptsService,
  ) {}

  @Get('pending')
  findPending(@Req() req: any) {
    return this.notificationPromptsService.findPendingPromptForUser(
      req.user.id,
    );
  }

  @Post(':id/respond')
  respond(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: RespondNotificationPromptDto,
  ) {
    return this.notificationPromptsService.respondToPrompt(
      req.user.id,
      id,
      dto.willGo,
    );
  }
}
