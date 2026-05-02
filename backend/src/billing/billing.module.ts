import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from '../queue/queue.module';
import { BillingTemplatesController } from './billing-templates.controller';
import { BillingTemplatesService } from './billing-templates.service';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { BillingWebhookService } from './billing-webhook.service';

@Module({
  imports: [PrismaModule, QueueModule],
  controllers: [BillingController, BillingTemplatesController],
  providers: [BillingService, BillingWebhookService, BillingTemplatesService],
  exports: [BillingWebhookService],
})
export class BillingModule {}
