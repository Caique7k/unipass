import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from '../queue/queue.module';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { BillingWebhookService } from './billing-webhook.service';

@Module({
  imports: [PrismaModule, QueueModule],
  controllers: [BillingController],
  providers: [BillingService, BillingWebhookService],
  exports: [BillingWebhookService],
})
export class BillingModule {}
