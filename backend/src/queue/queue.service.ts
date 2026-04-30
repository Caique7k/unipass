import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JobsOptions, Queue } from 'bullmq';
import Redis from 'ioredis';
import { getRedisOptions } from './redis.util';
import {
  BILLING_WEBHOOK_QUEUE,
  NOTIFICATIONS_QUEUE,
  PROCESS_BILLING_WEBHOOK_JOB,
  SEND_NOTIFICATION_JOB,
} from './queue.constants';

@Injectable()
export class QueueService implements OnModuleDestroy {
  private connection: Redis;
  private notificationQueue: Queue;
  private billingWebhookQueue: Queue;

  constructor(private readonly configService: ConfigService) {
    this.connection = new Redis(getRedisOptions(configService));

    this.notificationQueue = new Queue(NOTIFICATIONS_QUEUE, {
      connection: this.connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    });

    this.billingWebhookQueue = new Queue(BILLING_WEBHOOK_QUEUE, {
      connection: this.connection,
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 10_000,
        },
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    });
  }

  async addNotificationJob(
    data: { promptId: string },
    options?: Pick<JobsOptions, 'jobId' | 'delay'>,
  ) {
    await this.notificationQueue.add(SEND_NOTIFICATION_JOB, data, options);
  }

  async addBillingWebhookJob(
    data: { eventLogId: string },
    options?: Pick<JobsOptions, 'jobId' | 'delay'>,
  ) {
    await this.billingWebhookQueue.add(
      PROCESS_BILLING_WEBHOOK_JOB,
      data,
      options,
    );
  }

  async onModuleDestroy() {
    await this.billingWebhookQueue.close();
    await this.notificationQueue.close();
    await this.connection.quit();
  }
}
