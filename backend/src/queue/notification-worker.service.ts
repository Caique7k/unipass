import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worker } from 'bullmq';
import { NotificationPromptsService } from 'src/notification-prompts/notification-prompts.service';
import { NOTIFICATIONS_QUEUE } from './queue.constants';
import { getRedisOptions } from './redis.util';

@Injectable()
export class NotificationWorkerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(NotificationWorkerService.name);
  private worker?: Worker;

  constructor(
    private readonly configService: ConfigService,
    private readonly notificationPromptsService: NotificationPromptsService,
  ) {}

  onModuleInit() {
    this.worker = new Worker(
      NOTIFICATIONS_QUEUE,
      async (job) => {
        await this.notificationPromptsService.dispatchPrompt(
          job.data.promptId as string,
        );
      },
      {
        connection: {
          ...getRedisOptions(this.configService),
          maxRetriesPerRequest: null,
        },
        concurrency: Number(
          this.configService.get<string>('NOTIFICATION_WORKER_CONCURRENCY') ??
            '10',
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
