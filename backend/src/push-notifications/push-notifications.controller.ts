import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { DeactivatePushSubscriptionDto } from './dto/deactivate-push-subscription.dto';
import { RegisterPushSubscriptionDto } from './dto/register-push-subscription.dto';
import { PushNotificationsService } from './push-notifications.service';

@UseGuards(JwtAuthGuard)
@Controller('push-notifications')
export class PushNotificationsController {
  constructor(
    private readonly pushNotificationsService: PushNotificationsService,
  ) {}

  @Get('subscriptions')
  listCurrentUserSubscriptions(@Req() req: any) {
    return this.pushNotificationsService.listSubscriptions(req.user.id);
  }

  @Post('subscriptions')
  registerSubscription(
    @Req() req: any,
    @Body() dto: RegisterPushSubscriptionDto,
  ) {
    return this.pushNotificationsService.registerSubscription(req.user.id, dto);
  }

  @Post('subscriptions/deactivate')
  deactivateSubscription(
    @Req() req: any,
    @Body() dto: DeactivatePushSubscriptionDto,
  ) {
    return this.pushNotificationsService.deactivateSubscription(
      req.user.id,
      dto,
    );
  }
}
