import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationPromptsService } from 'src/notification-prompts/notification-prompts.service';
import { QueueService } from 'src/queue/queue.service';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  addDaysToDateKey,
  getAppTimeZone,
  getZonedDateParts,
} from './notification-time.util';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
    private readonly notificationPromptsService: NotificationPromptsService,
    private readonly configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleNotifications() {
    const timeZone = getAppTimeZone(
      this.configService.get<string>('APP_TIMEZONE'),
    );
    const zonedNow = getZonedDateParts(new Date(), timeZone);

    const schedules = await this.prisma.routeSchedule.findMany({
      where: {
        active: true,
        notificationTimeMinutes: zonedNow.minutesOfDay,
        route: {
          active: true,
        },
        notificationDayOfWeeks: {
          has: zonedNow.dayOfWeek,
        },
      },
      select: {
        id: true,
        type: true,
        departureMinutes: true,
        notifyBeforeMinutes: true,
        route: {
          select: {
            students: {
              select: {
                student: {
                  select: {
                    active: true,
                    user: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    for (const schedule of schedules) {
      const occurrenceKey =
        schedule.notifyBeforeMinutes > schedule.departureMinutes
          ? addDaysToDateKey(zonedNow.dateKey, 1)
          : zonedNow.dateKey;

      this.logger.log(
        `Preparando prompts do horário ${schedule.id} para ${occurrenceKey}.`,
      );

      for (const routeStudent of schedule.route.students) {
        const student = routeStudent.student;
        const user = student.user;

        if (!student.active || !user || !user.active) {
          continue;
        }

        const prompt =
          await this.notificationPromptsService.preparePromptForDispatch({
            userId: user.id,
            scheduleId: schedule.id,
            occurrenceKey,
            type: schedule.type,
          });

        if (!prompt.shouldEnqueue) {
          continue;
        }

        await this.queueService.addNotificationJob(
          {
            promptId: prompt.promptId,
          },
          {
            // BullMQ does not allow ":" in custom job ids.
            jobId: `notification-prompt-${prompt.promptId}`,
          },
        );
      }
    }
  }
}
