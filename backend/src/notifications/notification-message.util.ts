import { ScheduleType } from '@prisma/client';

export function buildNotificationMessage(type: ScheduleType) {
  switch (type) {
    case 'GO':
      return 'Você vai hoje com o ônibus?';
    case 'BACK':
      return 'Você vai embora com o ônibus hoje?';
    case 'SHIFT':
      return 'Você irá no turno hoje?';
  }
}
