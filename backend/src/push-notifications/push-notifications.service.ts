import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  NotificationChannel,
  PushNotificationProvider,
  PushPlatform,
  PushSubscription,
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { DeactivatePushSubscriptionDto } from './dto/deactivate-push-subscription.dto';
import { RegisterPushSubscriptionDto } from './dto/register-push-subscription.dto';

type DispatchPromptPayload = {
  promptId: string;
  userId: string;
  message: string;
  occurrenceKey: string;
  scheduleId: string;
  scheduleType: 'GO' | 'BACK' | 'SHIFT';
};

type ExpoPushTicket = {
  status?: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: {
    error?: string;
  };
};

type ExpoPushResponse = {
  data?: ExpoPushTicket[];
  errors?: Array<{
    message?: string;
  }>;
};

const EXPO_PUSH_API_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_TOKEN_REGEX = /^(ExponentPushToken|ExpoPushToken)\[[^\]]+\]$/;

@Injectable()
export class PushNotificationsService {
  private readonly logger = new Logger(PushNotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async listSubscriptions(userId: string) {
    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: {
        userId,
      },
      orderBy: [{ active: 'desc' }, { updatedAt: 'desc' }],
      select: {
        id: true,
        provider: true,
        platform: true,
        installationKey: true,
        deviceName: true,
        appVersion: true,
        active: true,
        lastSeenAt: true,
        lastSentAt: true,
        lastError: true,
        deactivatedAt: true,
        createdAt: true,
        updatedAt: true,
        token: true,
      },
    });

    return {
      data: subscriptions.map((subscription) =>
        this.mapSubscriptionResponse(subscription),
      ),
    };
  }

  async registerSubscription(
    userId: string,
    dto: RegisterPushSubscriptionDto,
  ) {
    const token = this.normalizeRequiredString(dto.token, 'Informe o token push.');
    const installationKey = this.normalizeOptionalString(dto.installationKey);
    const provider = this.resolveProvider(dto.provider, token);
    const platform = dto.platform ?? PushPlatform.UNKNOWN;
    const deviceName = this.normalizeOptionalString(dto.deviceName);
    const appVersion = this.normalizeOptionalString(dto.appVersion);
    const now = new Date();

    const subscription = await this.prisma.$transaction(async (tx) => {
      const existingByInstallation = installationKey
        ? await tx.pushSubscription.findUnique({
            where: {
              provider_installationKey: {
                provider,
                installationKey,
              },
            },
          })
        : null;

      const existingByToken = await tx.pushSubscription.findUnique({
        where: {
          provider_token: {
            provider,
            token,
          },
        },
      });

      if (
        existingByInstallation &&
        existingByToken &&
        existingByInstallation.id !== existingByToken.id
      ) {
        await tx.pushSubscription.delete({
          where: {
            id: existingByToken.id,
          },
        });
      }

      const target = existingByInstallation ?? existingByToken;

      if (target) {
        return tx.pushSubscription.update({
          where: {
            id: target.id,
          },
          data: {
            userId,
            provider,
            platform,
            token,
            installationKey,
            deviceName,
            appVersion,
            active: true,
            lastSeenAt: now,
            lastError: null,
            deactivatedAt: null,
          },
        });
      }

      return tx.pushSubscription.create({
        data: {
          userId,
          provider,
          platform,
          token,
          installationKey,
          deviceName,
          appVersion,
          active: true,
          lastSeenAt: now,
        },
      });
    });

    return {
      subscription: this.mapSubscriptionResponse(subscription),
    };
  }

  async deactivateSubscription(
    userId: string,
    dto: DeactivatePushSubscriptionDto,
  ) {
    const token = this.normalizeOptionalString(dto.token);
    const installationKey = this.normalizeOptionalString(dto.installationKey);

    if (!token && !installationKey) {
      throw new BadRequestException(
        'Informe pelo menos o token ou a installationKey para desativar.',
      );
    }

    const provider = token
      ? this.resolveProvider(dto.provider, token)
      : dto.provider;
    const now = new Date();

    const result = await this.prisma.pushSubscription.updateMany({
      where: {
        userId,
        active: true,
        ...(provider ? { provider } : {}),
        OR: [
          ...(token
            ? [
                {
                  token,
                },
              ]
            : []),
          ...(installationKey
            ? [
                {
                  installationKey,
                },
              ]
            : []),
        ],
      },
      data: {
        active: false,
        deactivatedAt: now,
        lastError: null,
      },
    });

    return {
      deactivatedCount: result.count,
    };
  }

  async dispatchPromptNotification(params: DispatchPromptPayload) {
    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: {
        userId: params.userId,
        active: true,
      },
      orderBy: [{ updatedAt: 'desc' }],
    });

    if (subscriptions.length === 0) {
      return {
        deliveryChannel: NotificationChannel.IN_APP,
        sentCount: 0,
      };
    }

    const expoSubscriptions = subscriptions.filter(
      (subscription) =>
        subscription.provider === PushNotificationProvider.EXPO &&
        this.isExpoToken(subscription.token),
    );
    const unsupportedSubscriptions = subscriptions.filter(
      (subscription) => !expoSubscriptions.some((item) => item.id === subscription.id),
    );

    if (unsupportedSubscriptions.length > 0) {
      this.logger.warn(
        `UsuÃ¡rio ${params.userId} possui ${unsupportedSubscriptions.length} subscription(s) push sem provider suportado para envio.`,
      );
    }

    let sentCount = 0;

    if (expoSubscriptions.length > 0) {
      sentCount += await this.sendExpoNotifications(expoSubscriptions, params);
    }

    return {
      deliveryChannel:
        sentCount > 0 ? NotificationChannel.PUSH : NotificationChannel.IN_APP,
      sentCount,
    };
  }

  private async sendExpoNotifications(
    subscriptions: PushSubscription[],
    params: DispatchPromptPayload,
  ) {
    const url =
      this.configService.get<string>('EXPO_PUSH_API_URL') ?? EXPO_PUSH_API_URL;
    const accessToken = this.normalizeOptionalString(
      this.configService.get<string>('EXPO_PUSH_ACCESS_TOKEN'),
    );

    const payload = subscriptions.map((subscription) => ({
      to: subscription.token,
      title: 'UniPass',
      body: params.message,
      sound: 'default',
      priority: 'high',
      data: {
        type: 'notification_prompt',
        promptId: params.promptId,
        scheduleId: params.scheduleId,
        scheduleType: params.scheduleType,
        occurrenceKey: params.occurrenceKey,
      },
    }));

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(accessToken
            ? {
                Authorization: `Bearer ${accessToken}`,
              }
            : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorMessage = `Expo Push API respondeu com status ${response.status}.`;
        await this.markSubscriptionsWithError(subscriptions, errorMessage);
        this.logger.warn(errorMessage);
        return 0;
      }

      const result = (await response.json()) as ExpoPushResponse;
      const tickets = Array.isArray(result.data) ? result.data : [];

      if (tickets.length === 0 && result.errors?.length) {
        const errorMessage =
          result.errors
            .map((item) => item.message)
            .filter((value): value is string => Boolean(value))
            .join('; ') || 'Expo Push API retornou erro sem detalhes.';

        await this.markSubscriptionsWithError(subscriptions, errorMessage);
        this.logger.warn(errorMessage);
        return 0;
      }

      const now = new Date();
      let sentCount = 0;

      await Promise.all(
        subscriptions.map(async (subscription, index) => {
          const ticket = tickets[index];

          if (ticket?.status === 'ok') {
            sentCount += 1;
            await this.prisma.pushSubscription.update({
              where: {
                id: subscription.id,
              },
              data: {
                lastSentAt: now,
                lastSeenAt: now,
                lastError: null,
              },
            });
            return;
          }

          const message =
            ticket?.message ??
            result.errors?.[0]?.message ??
            'Falha ao enviar push pelo provider Expo.';
          const shouldDeactivate =
            ticket?.details?.error === 'DeviceNotRegistered';

          await this.prisma.pushSubscription.update({
            where: {
              id: subscription.id,
            },
            data: {
              active: shouldDeactivate ? false : subscription.active,
              deactivatedAt: shouldDeactivate ? now : subscription.deactivatedAt,
              lastError: message,
            },
          });
        }),
      );

      return sentCount;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Falha desconhecida no envio push.';
      await this.markSubscriptionsWithError(subscriptions, message);
      this.logger.warn(`Falha ao chamar Expo Push API: ${message}`);
      return 0;
    }
  }

  private async markSubscriptionsWithError(
    subscriptions: PushSubscription[],
    message: string,
  ) {
    if (subscriptions.length === 0) {
      return;
    }

    await this.prisma.pushSubscription.updateMany({
      where: {
        id: {
          in: subscriptions.map((subscription) => subscription.id),
        },
      },
      data: {
        lastError: message,
      },
    });
  }

  private mapSubscriptionResponse(
    subscription: Pick<
      PushSubscription,
      | 'id'
      | 'provider'
      | 'platform'
      | 'installationKey'
      | 'deviceName'
      | 'appVersion'
      | 'active'
      | 'lastSeenAt'
      | 'lastSentAt'
      | 'lastError'
      | 'deactivatedAt'
      | 'createdAt'
      | 'updatedAt'
      | 'token'
    >,
  ) {
    return {
      id: subscription.id,
      provider: subscription.provider,
      platform: subscription.platform,
      installationKey: subscription.installationKey,
      deviceName: subscription.deviceName,
      appVersion: subscription.appVersion,
      active: subscription.active,
      tokenPreview: this.maskToken(subscription.token),
      lastSeenAt: subscription.lastSeenAt,
      lastSentAt: subscription.lastSentAt,
      lastError: subscription.lastError,
      deactivatedAt: subscription.deactivatedAt,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
    };
  }

  private resolveProvider(
    provider: PushNotificationProvider | undefined,
    token: string,
  ) {
    if (provider) {
      if (
        provider === PushNotificationProvider.EXPO &&
        !this.isExpoToken(token)
      ) {
        throw new BadRequestException('Token Expo invÃ¡lido.');
      }

      return provider;
    }

    if (this.isExpoToken(token)) {
      return PushNotificationProvider.EXPO;
    }

    throw new BadRequestException(
      'NÃ£o foi possÃ­vel identificar o provider do token push. Informe o campo provider.',
    );
  }

  private isExpoToken(token: string) {
    return EXPO_TOKEN_REGEX.test(token);
  }

  private normalizeRequiredString(value: string | undefined, message: string) {
    const normalized = value?.trim();

    if (!normalized) {
      throw new BadRequestException(message);
    }

    return normalized;
  }

  private normalizeOptionalString(value?: string | null) {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private maskToken(token: string) {
    if (token.length <= 12) {
      return token;
    }

    return `${token.slice(0, 8)}...${token.slice(-4)}`;
  }
}
