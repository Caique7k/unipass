import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationPromptStatus, Prisma } from '@prisma/client';
import { buildNotificationMessage } from 'src/notifications/notification-message.util';
import {
  getAppTimeZone,
  isPromptExpired,
} from 'src/notifications/notification-time.util';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class NotificationPromptsService {
  private readonly logger = new Logger(NotificationPromptsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async preparePromptForDispatch(params: {
    userId: string;
    scheduleId: string;
    occurrenceKey: string;
    type: 'GO' | 'BACK' | 'SHIFT';
  }) {
    const existing = await this.prisma.notificationPrompt.findUnique({
      where: {
        userId_scheduleId_occurrenceKey: {
          userId: params.userId,
          scheduleId: params.scheduleId,
          occurrenceKey: params.occurrenceKey,
        },
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!existing) {
      const prompt = await this.prisma.notificationPrompt.create({
        data: {
          userId: params.userId,
          scheduleId: params.scheduleId,
          occurrenceKey: params.occurrenceKey,
          message: buildNotificationMessage(params.type),
        },
        select: {
          id: true,
          status: true,
        },
      });

      return {
        promptId: prompt.id,
        shouldEnqueue: true,
      };
    }

    if (existing.status === NotificationPromptStatus.ANSWERED) {
      return {
        promptId: existing.id,
        shouldEnqueue: false,
      };
    }

    if (existing.status === NotificationPromptStatus.EXPIRED) {
      return {
        promptId: existing.id,
        shouldEnqueue: false,
      };
    }

    if (existing.status === NotificationPromptStatus.FAILED) {
      await this.prisma.notificationPrompt.update({
        where: { id: existing.id },
        data: {
          status: NotificationPromptStatus.PENDING,
          lastError: null,
        },
      });
    }

    return {
      promptId: existing.id,
      shouldEnqueue:
        existing.status === NotificationPromptStatus.PENDING ||
        existing.status === NotificationPromptStatus.FAILED,
    };
  }

  async dispatchPrompt(promptId: string) {
    const prompt = await this.prisma.notificationPrompt.findUnique({
      where: { id: promptId },
      include: {
        schedule: {
          select: {
            id: true,
            type: true,
            departureMinutes: true,
          },
        },
      },
    });

    if (!prompt) {
      this.logger.warn(`Prompt ${promptId} nao encontrado para dispatch.`);
      return;
    }

    if (prompt.status === NotificationPromptStatus.ANSWERED) {
      return;
    }

    if (
      prompt.status === NotificationPromptStatus.EXPIRED ||
      prompt.status === NotificationPromptStatus.DISPATCHED
    ) {
      return;
    }

    if (this.isExpired(prompt)) {
      await this.prisma.notificationPrompt.update({
        where: { id: prompt.id },
        data: {
          status: NotificationPromptStatus.EXPIRED,
          lastError: null,
        },
      });
      return;
    }

    try {
      await this.prisma.notificationPrompt.update({
        where: { id: prompt.id },
        data: {
          status: NotificationPromptStatus.DISPATCHED,
          dispatchedAt: new Date(),
          lastError: null,
        },
      });

      this.logger.log(
        `Prompt ${prompt.id} liberado para o usuario ${prompt.userId}.`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Falha desconhecida';

      await this.prisma.notificationPrompt.update({
        where: { id: prompt.id },
        data: {
          status: NotificationPromptStatus.FAILED,
          lastError: message,
        },
      });

      throw error;
    }
  }

  async findPendingPromptForUser(userId: string) {
    const prompts = await this.prisma.notificationPrompt.findMany({
      where: {
        userId,
        status: {
          in: [
            NotificationPromptStatus.PENDING,
            NotificationPromptStatus.DISPATCHED,
            NotificationPromptStatus.FAILED,
          ],
        },
      },
      orderBy: [{ occurrenceKey: 'asc' }, { createdAt: 'asc' }],
      take: 10,
      include: {
        schedule: {
          select: {
            id: true,
            type: true,
            title: true,
            departureTime: true,
            departureMinutes: true,
            dayOfWeek: true,
            notifyBeforeMinutes: true,
          },
        },
      },
    });

    for (const prompt of prompts) {
      if (this.isExpired(prompt)) {
        await this.prisma.notificationPrompt.update({
          where: { id: prompt.id },
          data: {
            status: NotificationPromptStatus.EXPIRED,
          },
        });
        continue;
      }

      if (
        prompt.status === NotificationPromptStatus.PENDING ||
        prompt.status === NotificationPromptStatus.FAILED
      ) {
        await this.prisma.notificationPrompt.update({
          where: { id: prompt.id },
          data: {
            status: NotificationPromptStatus.DISPATCHED,
            dispatchedAt: prompt.dispatchedAt ?? new Date(),
            lastError: null,
          },
        });
      }

      return {
        hasPending: true,
        prompt: {
          id: prompt.id,
          scheduleId: prompt.scheduleId,
          occurrenceKey: prompt.occurrenceKey,
          message: prompt.message,
          status:
            prompt.status === NotificationPromptStatus.PENDING ||
            prompt.status === NotificationPromptStatus.FAILED
              ? NotificationPromptStatus.DISPATCHED
              : prompt.status,
          dispatchedAt: prompt.dispatchedAt,
          schedule: prompt.schedule,
        },
      };
    }

    return {
      hasPending: false,
      prompt: null,
    };
  }

  async respondToPrompt(userId: string, promptId: string, willGo: boolean) {
    const prompt = await this.prisma.notificationPrompt.findFirst({
      where: {
        id: promptId,
        userId,
      },
      include: {
        schedule: {
          select: {
            id: true,
            departureMinutes: true,
          },
        },
      },
    });

    if (!prompt) {
      throw new NotFoundException('Prompt de notificacao nao encontrado');
    }

    if (this.isExpired(prompt)) {
      await this.prisma.notificationPrompt.update({
        where: { id: prompt.id },
        data: {
          status: NotificationPromptStatus.EXPIRED,
        },
      });

      throw new BadRequestException('Esse prompt ja expirou');
    }

    const [, confirmation] = await this.prisma.$transaction([
      this.prisma.notificationPrompt.update({
        where: { id: prompt.id },
        data: {
          status: NotificationPromptStatus.ANSWERED,
          response: willGo,
          answeredAt: new Date(),
          lastError: null,
        },
      }),
      this.prisma.scheduleConfirmation.upsert({
        where: {
          userId_scheduleId_occurrenceKey: {
            userId,
            scheduleId: prompt.scheduleId,
            occurrenceKey: prompt.occurrenceKey,
          },
        },
        update: {
          willGo,
        },
        create: {
          userId,
          scheduleId: prompt.scheduleId,
          occurrenceKey: prompt.occurrenceKey,
          willGo,
        },
      }),
    ]);

    return {
      promptId: prompt.id,
      occurrenceKey: prompt.occurrenceKey,
      willGo: confirmation.willGo,
      answeredAt: new Date(),
    };
  }

  private isExpired(
    prompt: Pick<
      Prisma.NotificationPromptGetPayload<{
        include: {
          schedule: {
            select: {
              departureMinutes: true;
            };
          };
        };
      }>,
      'occurrenceKey' | 'schedule'
    >,
  ) {
    return isPromptExpired({
      occurrenceKey: prompt.occurrenceKey,
      departureMinutes: prompt.schedule.departureMinutes,
      now: new Date(),
      timeZone: getAppTimeZone(this.configService.get<string>('APP_TIMEZONE')),
    });
  }
}
