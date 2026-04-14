import { ScheduleType } from '@prisma/client';

export function buildNotificationMessage(type: ScheduleType) {
  switch (type) {
    case 'GO':
      return 'Voce vai hoje com o onibus?';
    case 'BACK':
      return 'Voce vai embora com o onibus hoje?';
    case 'SHIFT':
      return 'Voce ira no turno hoje?';
  }
}
