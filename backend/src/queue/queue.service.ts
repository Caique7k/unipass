import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

@Injectable()
export class QueueService {
  private connection: Redis;
  private notificationQueue: Queue;

  constructor() {
    this.connection = new Redis({
      host: 'localhost',
      port: 6379,
    });

    this.notificationQueue = new Queue('notifications', {
      connection: this.connection,
    });
  }

  async addNotificationJob(data: { userId: string; scheduleId: string }) {
    await this.notificationQueue.add('send-notification', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    });
  }
}
