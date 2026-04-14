import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from 'src/queue/queue.module';
import { NotificationPromptsModule } from 'src/notification-prompts/notification-prompts.module';

@Module({
  imports: [PrismaModule, QueueModule, NotificationPromptsModule],
  providers: [NotificationsService],
})
export class NotificationsModule {}
