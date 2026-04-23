import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ScheduleType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { getScheduleMetadata } from './schedule-metadata.util';

const scheduleInclude = {
  bus: {
    select: {
      id: true,
      plate: true,
    },
  },
} satisfies Prisma.RouteScheduleInclude;

const ALL_DAY_VALUES = [0, 1, 2, 3, 4, 5, 6] as const;

type ScheduleWriteParams = {
  routeId: string;
  busId?: string | null;
  type: ScheduleType;
  title?: string | null;
  departureTime: Date;
  dayOfWeeks: number[];
  notifyBeforeMinutes: number;
  active?: boolean;
};

@Injectable()
export class RouteSchedulesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreateScheduleDto) {
    await this.ensureRouteBelongsToCompany(companyId, dto.routeId);
    await this.ensureBusBelongsToCompany(companyId, dto.busId);

    const departureTime = new Date(dto.departureTime);
    const dayOfWeeks = this.normalizeSelectedDays(
      dto.dayOfWeeks,
      dto.dayOfWeek,
    );
    const title = dto.title || null;
    const notifyBeforeMinutes = dto.notifyBeforeMinutes ?? 30;
    const departureMinutes = this.getDepartureMinutes(departureTime);

    await this.ensureScheduleSlotsAvailable({
      companyId,
      routeId: dto.routeId,
      busId: dto.busId,
      type: dto.type,
      title,
      departureMinutes,
      dayOfWeeks,
    });

    return this.prisma.routeSchedule.create({
      data: this.buildScheduleData({
        routeId: dto.routeId,
        busId: dto.busId,
        type: dto.type,
        title,
        departureTime,
        dayOfWeeks,
        notifyBeforeMinutes,
        active: true,
      }),
      include: scheduleInclude,
    });
  }

  async findByRoute({
    companyId,
    routeId,
    page = 1,
    limit = 10,
    search,
    active,
  }: {
    companyId: string;
    routeId: string;
    page?: number;
    limit?: number;
    search?: string;
    active?: boolean;
  }) {
    await this.ensureRouteBelongsToCompany(companyId, routeId);

    const normalizedPage = page > 0 ? page : 1;
    const normalizedLimit = limit > 0 ? limit : 10;
    const skip = (normalizedPage - 1) * normalizedLimit;
    const normalizedSearch = search?.trim();
    const typeFilter = this.normalizeScheduleType(normalizedSearch);
    const where: Prisma.RouteScheduleWhereInput = {
      routeId,
      route: {
        companyId,
      },
      ...(active !== undefined ? { active } : {}),
      ...(normalizedSearch
        ? {
            OR: [
              {
                title: {
                  contains: normalizedSearch,
                  mode: 'insensitive',
                },
              },
              {
                bus: {
                  plate: {
                    contains: normalizedSearch,
                    mode: 'insensitive',
                  },
                },
              },
              ...(typeFilter
                ? [
                    {
                      type: {
                        equals: typeFilter,
                      },
                    },
                  ]
                : []),
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.routeSchedule.findMany({
        where,
        skip,
        take: normalizedLimit,
        orderBy: [{ departureMinutes: 'asc' }, { createdAt: 'asc' }],
        include: scheduleInclude,
      }),
      this.prisma.routeSchedule.count({ where }),
    ]);

    return {
      data,
      total,
      page: normalizedPage,
      lastPage: Math.max(1, Math.ceil(total / normalizedLimit)),
    };
  }

  async findOne(companyId: string, id: string) {
    const schedule = await this.prisma.routeSchedule.findFirst({
      where: {
        id,
        route: {
          companyId,
        },
      },
      include: scheduleInclude,
    });

    if (!schedule) {
      throw new NotFoundException('Horário não encontrado.');
    }

    return schedule;
  }

  async update(companyId: string, id: string, dto: UpdateScheduleDto) {
    if (!this.hasUpdateValues(dto)) {
      throw new BadRequestException('Nenhum dado informado para atualizacao');
    }

    const currentSchedule = await this.findOne(companyId, id);
    const busId = dto.busId !== undefined ? dto.busId : currentSchedule.busId;
    await this.ensureBusBelongsToCompany(companyId, busId);

    const departureTime =
      dto.departureTime !== undefined
        ? new Date(dto.departureTime)
        : currentSchedule.departureTime;
    const notifyBeforeMinutes =
      dto.notifyBeforeMinutes !== undefined
        ? dto.notifyBeforeMinutes
        : currentSchedule.notifyBeforeMinutes;
    const title =
      dto.title !== undefined ? dto.title || null : currentSchedule.title;
    const type = dto.type ?? currentSchedule.type;
    const active = dto.active ?? currentSchedule.active;
    const dayOfWeeks = this.normalizeSelectedDays(
      dto.dayOfWeeks,
      dto.dayOfWeek,
      currentSchedule.dayOfWeeks,
    );
    const departureMinutes = this.getDepartureMinutes(departureTime);

    if (active) {
      await this.ensureScheduleSlotsAvailable({
        companyId,
        routeId: currentSchedule.routeId,
        busId,
        type,
        title,
        departureMinutes,
        dayOfWeeks,
        excludeId: id,
      });
    }

    return this.prisma.routeSchedule.update({
      where: { id },
      data: this.buildScheduleData({
        routeId: currentSchedule.routeId,
        busId,
        type,
        title,
        departureTime,
        dayOfWeeks,
        notifyBeforeMinutes,
        active,
      }),
      include: scheduleInclude,
    });
  }

  async deactivateMany(companyId: string, ids: string[]) {
    return this.prisma.routeSchedule.updateMany({
      where: {
        id: {
          in: ids,
        },
        route: {
          companyId,
        },
      },
      data: {
        active: false,
      },
    });
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);

    return this.prisma.routeSchedule.update({
      where: { id },
      data: {
        active: false,
      },
    });
  }

  private buildScheduleData(params: ScheduleWriteParams) {
    const metadata = getScheduleMetadata({
      departureTime: params.departureTime,
      dayOfWeeks: params.dayOfWeeks,
      notifyBeforeMinutes: params.notifyBeforeMinutes,
    });

    return {
      routeId: params.routeId,
      busId: params.busId ?? null,
      type: params.type,
      title: params.title || null,
      departureTime: params.departureTime,
      dayOfWeeks: params.dayOfWeeks,
      notifyBeforeMinutes: params.notifyBeforeMinutes,
      departureMinutes: metadata.departureMinutes,
      notificationTimeMinutes: metadata.notificationTimeMinutes,
      notificationDayOfWeeks: metadata.notificationDayOfWeeks,
      ...(params.active !== undefined ? { active: params.active } : {}),
    };
  }

  private hasUpdateValues(dto: UpdateScheduleDto) {
    return (
      dto.busId !== undefined ||
      dto.type !== undefined ||
      dto.title !== undefined ||
      dto.departureTime !== undefined ||
      dto.dayOfWeek !== undefined ||
      dto.dayOfWeeks !== undefined ||
      dto.notifyBeforeMinutes !== undefined ||
      dto.active !== undefined
    );
  }

  private normalizeSelectedDays(
    dayOfWeeks?: number[],
    dayOfWeek?: number | null,
    fallbackDayOfWeeks?: number[],
  ) {
    if (dayOfWeeks && dayOfWeeks.length > 0) {
      return this.normalizeDayList(dayOfWeeks);
    }

    if (dayOfWeek !== undefined) {
      return dayOfWeek === null ? [...ALL_DAY_VALUES] : [dayOfWeek];
    }

    if (fallbackDayOfWeeks && fallbackDayOfWeeks.length > 0) {
      return this.normalizeDayList(fallbackDayOfWeeks);
    }

    return [...ALL_DAY_VALUES];
  }

  private normalizeDayList(dayOfWeeks: number[]) {
    return [...new Set(dayOfWeeks)].sort((left, right) => left - right);
  }

  private getDepartureMinutes(departureTime: Date) {
    return departureTime.getUTCHours() * 60 + departureTime.getUTCMinutes();
  }

  private async ensureScheduleSlotsAvailable(params: {
    companyId: string;
    routeId: string;
    busId?: string | null;
    type: ScheduleType;
    title?: string | null;
    departureMinutes: number;
    dayOfWeeks: number[];
    excludeId?: string;
  }) {
    for (const dayOfWeek of params.dayOfWeeks) {
      const conflictingSchedule = await this.prisma.routeSchedule.findFirst({
        where: {
          routeId: params.routeId,
          route: {
            companyId: params.companyId,
          },
          active: true,
          type: params.type,
          title: params.title || null,
          busId: params.busId ?? null,
          departureMinutes: params.departureMinutes,
          dayOfWeeks: {
            has: dayOfWeek,
          },
          ...(params.excludeId
            ? {
                id: {
                  not: params.excludeId,
                },
              }
            : {}),
        },
        select: {
          id: true,
        },
      });

      if (conflictingSchedule) {
        throw new BadRequestException(
          `Já existe um horário idêntico configurado para ${this.getDayLabel(dayOfWeek)}.`,
        );
      }
    }
  }

  private async ensureRouteBelongsToCompany(
    companyId: string,
    routeId: string,
  ) {
    const route = await this.prisma.route.findFirst({
      where: {
        id: routeId,
        companyId,
      },
      select: {
        id: true,
      },
    });

    if (!route) {
      throw new NotFoundException('Rota não encontrada.');
    }
  }

  private async ensureBusBelongsToCompany(
    companyId: string,
    busId?: string | null,
  ) {
    if (!busId) {
      return;
    }

    const bus = await this.prisma.bus.findFirst({
      where: {
        id: busId,
        companyId,
      },
      select: {
        id: true,
      },
    });

    if (!bus) {
      throw new BadRequestException('Ônibus não encontrado para esta empresa.');
    }
  }

  private normalizeScheduleType(search?: string): ScheduleType | undefined {
    const value = search?.trim().toUpperCase();

    if (value === 'GO' || value === 'BACK' || value === 'SHIFT') {
      return value as ScheduleType;
    }

    return undefined;
  }

  private getDayLabel(dayOfWeek: number) {
    switch (dayOfWeek) {
      case 0:
        return 'domingo';
      case 1:
        return 'segunda';
      case 2:
        return 'terca';
      case 3:
        return 'quarta';
      case 4:
        return 'quinta';
      case 5:
        return 'sexta';
      case 6:
        return 'sabado';
      default:
        return 'o dia selecionado';
    }
  }
}
