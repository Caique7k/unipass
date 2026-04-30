import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BillingModule } from 'src/billing/billing.module';
import { NotificationPromptsModule } from 'src/notification-prompts/notification-prompts.module';
import { BillingWebhookWorkerService } from './billing-webhook-worker.service';
import { NotificationWorkerService } from './notification-worker.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    NotificationPromptsModule,
    BillingModule,
  ],
  providers: [NotificationWorkerService, BillingWebhookWorkerService],
})
export class NotificationWorkerModule {}
