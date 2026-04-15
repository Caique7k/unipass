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

type ScheduleWriteParams = {
  routeId: string;
  busId?: string | null;
  type: ScheduleType;
  title?: string | null;
  departureTime: Date;
  dayOfWeek?: number | null;
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
    const dayOfWeeks = this.normalizeSelectedDays(dto.dayOfWeeks, dto.dayOfWeek);
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

    const createdSchedules = await this.prisma.$transaction(
      dayOfWeeks.map((dayOfWeek) =>
        this.prisma.routeSchedule.create({
          data: this.buildScheduleData({
            routeId: dto.routeId,
            busId: dto.busId,
            type: dto.type,
            title,
            departureTime,
            dayOfWeek,
            notifyBeforeMinutes,
            active: true,
          }),
          include: scheduleInclude,
        }),
      ),
    );

    return createdSchedules.length === 1
      ? createdSchedules[0]
      : { createdSchedules };
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
        orderBy: [{ dayOfWeek: 'asc' }, { departureTime: 'asc' }],
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
      throw new NotFoundException('Horario nao encontrado');
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
    const title = dto.title !== undefined ? dto.title || null : currentSchedule.title;
    const type = dto.type ?? currentSchedule.type;
    const active = dto.active ?? currentSchedule.active;
    const dayOfWeeks = this.normalizeSelectedDays(
      dto.dayOfWeeks,
      dto.dayOfWeek,
      currentSchedule.dayOfWeek,
    );
    const primaryDayOfWeek = this.pickPrimaryDayOfWeek(
      dayOfWeeks,
      currentSchedule.dayOfWeek,
    );
    const additionalDays = dayOfWeeks.filter((day) => day !== primaryDayOfWeek);
    const departureMinutes = this.getDepartureMinutes(departureTime);

    if (active) {
      await this.ensureScheduleSlotsAvailable({
        companyId,
        routeId: currentSchedule.routeId,
        busId,
        type,
        title,
        departureMinutes,
        dayOfWeeks: [primaryDayOfWeek],
        excludeId: id,
      });

      if (additionalDays.length > 0) {
        await this.ensureScheduleSlotsAvailable({
          companyId,
          routeId: currentSchedule.routeId,
          busId,
          type,
          title,
          departureMinutes,
          dayOfWeeks: additionalDays,
        });
      }
    }

    const updatedSchedules = await this.prisma.$transaction([
      this.prisma.routeSchedule.update({
        where: { id },
        data: this.buildScheduleData({
          routeId: currentSchedule.routeId,
          busId,
          type,
          title,
          departureTime,
          dayOfWeek: primaryDayOfWeek,
          notifyBeforeMinutes,
          active,
        }),
        include: scheduleInclude,
      }),
      ...additionalDays.map((dayOfWeek) =>
        this.prisma.routeSchedule.create({
          data: this.buildScheduleData({
            routeId: currentSchedule.routeId,
            busId,
            type,
            title,
            departureTime,
            dayOfWeek,
            notifyBeforeMinutes,
            active,
          }),
          include: scheduleInclude,
        }),
      ),
    ]);

    return updatedSchedules.length === 1
      ? updatedSchedules[0]
      : {
          updatedSchedule: updatedSchedules[0],
          createdSchedules: updatedSchedules.slice(1),
        };
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
      dayOfWeek: params.dayOfWeek ?? null,
      notifyBeforeMinutes: params.notifyBeforeMinutes,
    });

    return {
      routeId: params.routeId,
      busId: params.busId ?? null,
      type: params.type,
      title: params.title || null,
      departureTime: params.departureTime,
      dayOfWeek: params.dayOfWeek ?? null,
      notifyBeforeMinutes: params.notifyBeforeMinutes,
      departureMinutes: metadata.departureMinutes,
      notificationTimeMinutes: metadata.notificationTimeMinutes,
      notificationDayOfWeek: metadata.notificationDayOfWeek,
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
    fallbackDayOfWeek?: number | null,
  ) {
    if (dayOfWeeks && dayOfWeeks.length > 0) {
      return [...new Set(dayOfWeeks)].sort((left, right) => left - right);
    }

    if (dayOfWeek !== undefined) {
      return [dayOfWeek];
    }

    return [fallbackDayOfWeek ?? null];
  }

  private pickPrimaryDayOfWeek(
    dayOfWeeks: Array<number | null>,
    currentDayOfWeek?: number | null,
  ) {
    const normalizedCurrentDay = currentDayOfWeek ?? null;

    if (dayOfWeeks.includes(normalizedCurrentDay)) {
      return normalizedCurrentDay;
    }

    return dayOfWeeks[0] ?? null;
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
    dayOfWeeks: Array<number | null>;
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
          dayOfWeek,
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
          dayOfWeek === null
            ? 'Ja existe um horario identico configurado para todos os dias'
            : `Ja existe um horario identico configurado para ${this.getDayLabel(dayOfWeek)}`,
        );
      }
    }
  }

  private async ensureRouteBelongsToCompany(companyId: string, routeId: string) {
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
      throw new NotFoundException('Rota nao encontrada');
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
      throw new BadRequestException('Onibus nao encontrado para esta empresa');
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
