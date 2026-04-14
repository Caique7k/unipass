import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  getAppTimeZone,
  getZonedDateParts,
} from 'src/notifications/notification-time.util';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ConfirmationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async confirm(
    userId: string,
    scheduleId: string,
    willGo: boolean,
    occurrenceKey?: string,
  ) {
    const resolvedOccurrenceKey =
      occurrenceKey ??
      getZonedDateParts(
        new Date(),
        getAppTimeZone(this.configService.get<string>('APP_TIMEZONE')),
      ).dateKey;

    return this.prisma.scheduleConfirmation.upsert({
      where: {
        userId_scheduleId_occurrenceKey: {
          userId,
          scheduleId,
          occurrenceKey: resolvedOccurrenceKey,
        },
      },
      update: { willGo },
      create: {
        userId,
        scheduleId,
        occurrenceKey: resolvedOccurrenceKey,
        willGo,
      },
    });
  }
}
