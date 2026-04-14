import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConfirmationsService {
  constructor(private prisma: PrismaService) {}

  async confirm(userId: string, scheduleId: string, willGo: boolean) {
    return this.prisma.scheduleConfirmation.upsert({
      where: {
        userId_scheduleId: {
          userId,
          scheduleId,
        },
      },
      update: { willGo },
      create: {
        userId,
        scheduleId,
        willGo,
      },
    });
  }
}
