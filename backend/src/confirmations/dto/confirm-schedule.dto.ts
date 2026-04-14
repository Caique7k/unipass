import { IsUUID, IsBoolean } from 'class-validator';

export class ConfirmScheduleDto {
  @IsUUID()
  scheduleId: string;

  @IsBoolean()
  willGo: boolean;
}
