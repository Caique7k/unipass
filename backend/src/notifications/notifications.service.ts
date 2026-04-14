import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from 'src/queue/queue.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private queueService: QueueService,
  ) {}

  @Cron('* * * * *') // roda a cada minuto
  async handleNotifications() {
    const now = new Date();

    const dayOfWeek = now.getDay(); // 0 = domingo

    // busca schedules ativos do dia
    const schedules = await this.prisma.routeSchedule.findMany({
      where: {
        active: true,
        OR: [{ dayOfWeek: null }, { dayOfWeek }],
      },
      include: {
        route: {
          include: {
            students: {
              include: {
                student: {
                  include: {
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
      const departure = new Date();
      departure.setHours(
        new Date(schedule.departureTime).getHours(),
        new Date(schedule.departureTime).getMinutes(),
        0,
        0,
      );

      const notifyTime = new Date(
        departure.getTime() - schedule.notifyBeforeMinutes * 60000,
      );

      // janela de 1 minuto
      const diff = Math.abs(now.getTime() - notifyTime.getTime());

      if (diff > 60000) continue;

      this.logger.log(`Disparando notificações: ${schedule.id}`);

      for (const sr of schedule.route.students) {
        const user = sr.student.user;

        if (!user) continue;

        // verifica se já respondeu
        const alreadyConfirmed =
          await this.prisma.scheduleConfirmation.findUnique({
            where: {
              userId_scheduleId: {
                userId: user.id,
                scheduleId: schedule.id,
              },
            },
          });

        if (alreadyConfirmed) continue;

        await this.queueService.addNotificationJob({
          userId: user.id,
          scheduleId: schedule.id,
        });
      }
    }
  }

  private sendNotification(userId: string, schedule: any) {
    let message = '';

    switch (schedule.type) {
      case 'GO':
        message = 'Você vai hoje com o ônibus?';
        break;
      case 'BACK':
        message = 'Você vai embora com o ônibus hoje?';
        break;
      case 'SHIFT':
        message = 'Você irá no turno hoje?';
        break;
    }

    // por enquanto log
    this.logger.log(`Notificação -> ${userId}: ${message}`);

    // FUTURO:
    // Firebase Push
    // WebSocket
    // WhatsApp
    // SMS
  }
}
