import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
    companyId: string | null | undefined,
    scheduleId: string,
    willGo: boolean,
    occurrenceKey?: string,
  ) {
    if (!companyId) {
      throw new BadRequestException('Usuario sem empresa vinculada.');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        companyId: true,
        studentId: true,
        active: true,
      },
    });

    if (!user || !user.active || user.companyId !== companyId) {
      throw new BadRequestException('Usuario invalido para confirmar horario.');
    }

    const schedule = await this.prisma.routeSchedule.findFirst({
      where: {
        id: scheduleId,
        route: {
          companyId,
          ...(user.studentId
            ? {
                students: {
                  some: {
                    studentId: user.studentId,
                  },
                },
              }
            : {}),
        },
      },
      select: {
        id: true,
      },
    });

    if (!schedule) {
      throw new NotFoundException('Horario nao encontrado para este usuario.');
    }

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
          scheduleId: schedule.id,
          occurrenceKey: resolvedOccurrenceKey,
        },
      },
      update: { willGo },
      create: {
        userId,
        scheduleId: schedule.id,
        occurrenceKey: resolvedOccurrenceKey,
        willGo,
      },
    });
  }
}
