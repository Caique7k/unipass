import { PushNotificationProvider, PushPlatform } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class RegisterPushSubscriptionDto {
  @IsString()
  token: string;

  @IsOptional()
  @IsEnum(PushNotificationProvider)
  provider?: PushNotificationProvider;

  @IsOptional()
  @IsEnum(PushPlatform)
  platform?: PushPlatform;

  @IsOptional()
  @IsString()
  installationKey?: string;

  @IsOptional()
  @IsString()
  deviceName?: string;

  @IsOptional()
  @IsString()
  appVersion?: string;
}
