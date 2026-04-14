import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationPromptsModule } from 'src/notification-prompts/notification-prompts.module';
import { NotificationWorkerService } from './notification-worker.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), NotificationPromptsModule],
  providers: [NotificationWorkerService],
})
export class NotificationWorkerModule {}
