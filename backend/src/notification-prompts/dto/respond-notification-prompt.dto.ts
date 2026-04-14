import { IsBoolean } from 'class-validator';

export class RespondNotificationPromptDto {
  @IsBoolean()
  willGo: boolean;
}
