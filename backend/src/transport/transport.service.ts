import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  getAppTimeZone,
  getZonedDateParts,
} from 'src/notifications/notification-time.util';
import { BoardingDto } from './dto/boarding.dto';
import { IotBoardingDto } from './dto/iot-boarding.dto';

@Injectable()
export class TransportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private readonly overviewStudentSelect = {
    id: true,
    name: true,
    registration: true,
    email: true,
    phone: true,
    group: {
      select: {
        id: true,
        name: true,
      },
    },
    rfidCards: {
      where: {
        active: true,
      },
      select: {
        id: true,
        tag: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    },
    routes: {
      select: {
        route: {
          select: {
            id: true,
            name: true,
            active: true,
          },
        },
      },
    },
  } satisfies Prisma.StudentSelect;

  private async validateDevice(deviceIdentifier: string) {
    const device = await this.prisma.device.findUnique({
      where: { code: deviceIdentifier },
    });

    if (!device) {
      throw new NotFoundException('Dispositivo não encontrado.');
    }

    if (!device.active) {
      throw new BadRequestException('Device inativo');
    }

    if (!device.companyId) {
      throw new BadRequestException('Dispositivo não vinculado.');
    }

    return device;
  }

  private ensureDeviceBelongsToCompany(
    device: { companyId: string | null },
    companyId?: string | null,
  ) {
    if (!companyId) {
      throw new ForbiddenException('Usuario sem empresa vinculada');
    }

    if (device.companyId !== companyId) {
      throw new ForbiddenException(
        'Este dispositivo não pertence à empresa do usuário autenticado.',
      );
    }
  }

  private async validateDeviceCredentials(code: string, secret: string) {
    const device = await this.prisma.device.findUnique({
      where: { code },
    });

    if (!device || device.secret !== secret) {
      throw new NotFoundException('Credenciais do dispositivo inválidas.');
    }

    if (!device.active) {
      throw new BadRequestException('Device inativo');
    }

    if (!device.companyId) {
      throw new BadRequestException('O dispositivo ainda não foi vinculado no painel.');
    }

    return device;
  }

  private async getCardWithStudent(tag: string, companyId: string) {
    return this.prisma.rfidCard.findFirst({
      where: {
        tag,
        companyId,
      },
      include: {
        student: true,
      },
    });
  }

  private async processBoarding(device: any, rfidTag: string) {
    const card = await this.getCardWithStudent(rfidTag, device.companyId);

    if (!card || !card.student) {
      await this.logDenied(device, card);
      throw new ForbiddenException('TAG não autorizada.');
    }

    const student = card.student;

    if (card.companyId !== device.companyId || student.companyId !== device.companyId) {
      await this.logDenied(device, card, student.id);
      throw new ForbiddenException(
        'A TAG não pertence à mesma empresa do dispositivo.',
      );
    }

    if (!student.active) {
      await this.logDenied(device, card, student.id);
      throw new ForbiddenException('Aluno inativo');
    }

    const lastEvent = await this.prisma.transportEvent.findFirst({
      where: {
        studentId: student.id,
        deviceId: device.id,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (lastEvent?.type === 'BOARDING') {
      throw new BadRequestException('O aluno já está no ônibus.');
    }

    const event = await this.prisma.transportEvent.create({
      data: {
        type: 'BOARDING',
        studentId: student.id,
        rfidCardId: card.id,
        deviceId: device.id,
        companyId: device.companyId!,
      },
    });

    return {
      status: 'AUTHORIZED',
      action: 'BOARDING',
      student: {
        id: student.id,
        name: student.name,
      },
      timestamp: event.createdAt,
    };
  }

  private async processDeboarding(device: any, rfidTag: string) {
    const card = await this.getCardWithStudent(rfidTag, device.companyId);

    if (!card || !card.student) {
      throw new ForbiddenException('TAG não autorizada.');
    }

    const student = card.student;

    if (card.companyId !== device.companyId || student.companyId !== device.companyId) {
      await this.logDenied(device, card, student.id);
      throw new ForbiddenException(
        'A TAG não pertence à mesma empresa do dispositivo.',
      );
    }

    const lastEvent = await this.prisma.transportEvent.findFirst({
      where: {
        studentId: student.id,
        deviceId: device.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!lastEvent || lastEvent.type !== 'BOARDING') {
      throw new BadRequestException('O aluno não está no ônibus.');
    }

    const event = await this.prisma.transportEvent.create({
      data: {
        type: 'DEBOARDING',
        studentId: student.id,
        rfidCardId: card.id,
        deviceId: device.id,
        companyId: device.companyId!,
      },
    });

    return {
      status: 'AUTHORIZED',
      action: 'DEBOARDING',
      student: {
        id: student.id,
        name: student.name,
      },
      timestamp: event.createdAt,
    };
  }

  async registerBoarding(companyId: string | null | undefined, dto: BoardingDto) {
    const device = await this.validateDevice(dto.deviceIdentifier);
    this.ensureDeviceBelongsToCompany(device, companyId);
    return this.processBoarding(device, dto.rfidTag);
  }

  async registerIotBoarding(dto: IotBoardingDto) {
    const device = await this.validateDeviceCredentials(dto.code, dto.secret);
    return this.processBoarding(device, dto.rfidTag);
  }

  async registerDeboarding(
    companyId: string | null | undefined,
    dto: BoardingDto,
  ) {
    const device = await this.validateDevice(dto.deviceIdentifier);
    this.ensureDeviceBelongsToCompany(device, companyId);
    return this.processDeboarding(device, dto.rfidTag);
  }

  async registerIotDeboarding(dto: IotBoardingDto) {
    const device = await this.validateDeviceCredentials(dto.code, dto.secret);
    return this.processDeboarding(device, dto.rfidTag);
  }

  async getDailyBoardingOverview(companyId: string) {
    const now = new Date();
    const timeZone = getAppTimeZone(
      this.configService.get<string>('APP_TIMEZONE'),
    );
    const todayDateKey = getZonedDateParts(now, timeZone).dateKey;
    const boardingsLookbackStart = new Date(
      now.getTime() - 36 * 60 * 60 * 1000,
    );

    const [activeStudents, boardingEvents] = await this.prisma.$transaction([
      this.prisma.student.findMany({
        where: {
          companyId,
          active: true,
        },
        orderBy: {
          name: 'asc',
        },
        select: this.overviewStudentSelect,
      }),
      this.prisma.transportEvent.findMany({
        where: {
          companyId,
          type: 'BOARDING',
          studentId: {
            not: null,
          },
          createdAt: {
            gte: boardingsLookbackStart,
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
        select: {
          id: true,
          createdAt: true,
          studentId: true,
          student: {
            select: this.overviewStudentSelect,
          },
          device: {
            select: {
              id: true,
              code: true,
              name: true,
              bus: {
                select: {
                  id: true,
                  plate: true,
                  capacity: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const boardingsByStudent = new Map<
      string,
      {
        student: NonNullable<(typeof boardingEvents)[number]['student']>;
        events: (typeof boardingEvents)[number][];
      }
    >();

    for (const event of boardingEvents) {
      if (!event.studentId || !event.student) {
        continue;
      }

      const dateKey = getZonedDateParts(event.createdAt, timeZone).dateKey;

      if (dateKey !== todayDateKey) {
        continue;
      }

      const current = boardingsByStudent.get(event.studentId);

      if (!current) {
        boardingsByStudent.set(event.studentId, {
          student: event.student,
          events: [event],
        });
        continue;
      }

      current.events.push(event);
    }

    const activeStudentIds = new Set(activeStudents.map((student) => student.id));
    const notBoardedStudents: Array<{
      id: string;
      name: string;
      registration: string;
      email: string | null;
      phone: string | null;
      group: {
        id: string;
        name: string;
      } | null;
      rfidTag: string | null;
      routeNames: string[];
      boardingCountToday: number;
      firstBoardingAt: Date;
      firstDeviceId: string;
      firstDeviceCode: string | null;
      firstDeviceName: string | null;
      firstBusId: string | null;
      firstBusPlate: string;
    }> = [];
    const boardedStudents: Array<{
      id: string;
      name: string;
      registration: string;
      email: string | null;
      phone: string | null;
      group: {
        id: string;
        name: string;
      } | null;
      rfidTag: string | null;
      routeNames: string[];
      boardingCountToday: number;
      firstBoardingAt: Date;
      secondBoardingAt: Date;
      busId: string | null;
      busFilterKey: string;
      busPlate: string;
      capacity: number | null;
      deviceId: string;
      deviceCode: string | null;
      deviceName: string | null;
    }> = [];
    const busesWithSecondBoarding = new Set<string>();

    for (const [studentId, record] of boardingsByStudent.entries()) {
      if (!activeStudentIds.has(studentId)) {
        continue;
      }

      const [firstBoarding, secondBoarding] = record.events;
      const baseStudent = {
        id: record.student.id,
        name: record.student.name,
        registration: record.student.registration,
        email: record.student.email,
        phone: record.student.phone,
        group: record.student.group,
        rfidTag: record.student.rfidCards[0]?.tag ?? null,
        routeNames: record.student.routes
          .map((studentRoute) => studentRoute.route.name)
          .sort((left, right) => left.localeCompare(right)),
        boardingCountToday: record.events.length,
      };

      if (!secondBoarding) {
        notBoardedStudents.push({
          ...baseStudent,
          firstBoardingAt: firstBoarding.createdAt,
          firstDeviceId: firstBoarding.device.id,
          firstDeviceCode: firstBoarding.device.code,
          firstDeviceName: firstBoarding.device.name,
          firstBusId: firstBoarding.device.bus?.id ?? null,
          firstBusPlate: firstBoarding.device.bus?.plate ?? 'Sem ônibus vinculado',
        });
        continue;
      }

      const busFilterKey = secondBoarding.device.bus?.id
        ? secondBoarding.device.bus.id
        : `device-${secondBoarding.device.id}`;

      boardedStudents.push({
        ...baseStudent,
        firstBoardingAt: firstBoarding.createdAt,
        secondBoardingAt: secondBoarding.createdAt,
        busId: secondBoarding.device.bus?.id ?? null,
        busFilterKey,
        busPlate: secondBoarding.device.bus?.plate ?? 'Sem ônibus vinculado',
        capacity: secondBoarding.device.bus?.capacity ?? null,
        deviceId: secondBoarding.device.id,
        deviceCode: secondBoarding.device.code,
        deviceName: secondBoarding.device.name,
      });

      busesWithSecondBoarding.add(busFilterKey);
    }

    notBoardedStudents.sort(
      (left, right) =>
        left.firstBoardingAt.getTime() - right.firstBoardingAt.getTime(),
    );
    boardedStudents.sort(
      (left, right) =>
        right.secondBoardingAt.getTime() - left.secondBoardingAt.getTime(),
    );

    const busOptions = Array.from(
      new Map(
        boardedStudents.map((student) => [
          student.busFilterKey,
          {
            value: student.busFilterKey,
            label: student.busPlate,
          },
        ]),
      ).values(),
    ).sort((left, right) => left.label.localeCompare(right.label));

    return {
      dateKey: todayDateKey,
      generatedAt: now,
      summary: {
        studentsWithFirstBoarding:
          notBoardedStudents.length + boardedStudents.length,
        waitingSecondBoarding: notBoardedStudents.length,
        secondBoardingDone: boardedStudents.length,
        busesWithSecondBoarding: busesWithSecondBoarding.size,
      },
      busOptions,
      boardedStudents,
      notBoardedStudents,
    };
  }

  private async logDenied(device: any, card?: any, studentId?: string) {
    await this.prisma.transportEvent.create({
      data: {
        type: 'DENIED',
        deviceId: device.id,
        companyId: device.companyId,
        rfidCardId: card?.id || undefined,
        studentId: studentId || undefined,
      },
    });
  }
}
