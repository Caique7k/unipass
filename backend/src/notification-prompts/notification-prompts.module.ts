import { Module } from '@nestjs/common';
import { NotificationPromptsController } from './notification-prompts.controller';
import { NotificationPromptsService } from './notification-prompts.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PushNotificationsModule } from 'src/push-notifications/push-notifications.module';

@Module({
  imports: [PrismaModule, PushNotificationsModule],
  controllers: [NotificationPromptsController],
  providers: [NotificationPromptsService],
  exports: [NotificationPromptsService],
})
export class NotificationPromptsModule {}
