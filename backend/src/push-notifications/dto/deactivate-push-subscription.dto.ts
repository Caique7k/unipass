import { PushNotificationProvider } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class DeactivatePushSubscriptionDto {
  @IsOptional()
  @IsEnum(PushNotificationProvider)
  provider?: PushNotificationProvider;

  @IsOptional()
  @IsString()
  token?: string;

  @IsOptional()
  @IsString()
  installationKey?: string;
}
