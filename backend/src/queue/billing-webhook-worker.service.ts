import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worker } from 'bullmq';
import { BillingWebhookService } from 'src/billing/billing-webhook.service';
import {
  BILLING_WEBHOOK_QUEUE,
  PROCESS_BILLING_WEBHOOK_JOB,
} from './queue.constants';
import { getRedisOptions } from './redis.util';

@Injectable()
export class BillingWebhookWorkerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(BillingWebhookWorkerService.name);
  private worker?: Worker;

  constructor(
    private readonly configService: ConfigService,
    private readonly billingWebhookService: BillingWebhookService,
  ) {}

  onModuleInit() {
    this.worker = new Worker(
      BILLING_WEBHOOK_QUEUE,
      async (job) => {
        if (job.name !== PROCESS_BILLING_WEBHOOK_JOB) {
          return;
        }

        await this.billingWebhookService.processWebhookEventLog(
          job.data.eventLogId as string,
        );
      },
      {
        connection: {
          ...getRedisOptions(this.configService),
          maxRetriesPerRequest: null,
        },
        concurrency: Number(
          this.configService.get<string>(
            'BILLING_WEBHOOK_WORKER_CONCURRENCY',
          ) ?? '5',
        ),
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.log(`Job concluido: ${job.id}`);
    });

    this.worker.on('failed', (job, error) => {
      this.logger.error(`Job falhou: ${job?.id}`, error?.stack ?? error);
    });
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }
}
