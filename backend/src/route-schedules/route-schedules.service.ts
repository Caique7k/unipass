import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { Prisma, ScheduleType } from '@prisma/client';
import { getScheduleMetadata } from './schedule-metadata.util';

@Injectable()
export class RouteSchedulesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreateScheduleDto) {
    await this.ensureRouteBelongsToCompany(companyId, dto.routeId);
    await this.ensureBusBelongsToCompany(companyId, dto.busId);
    const departureTime = new Date(dto.departureTime);
    const metadata = getScheduleMetadata({
      departureTime,
      dayOfWeek: dto.dayOfWeek ?? null,
      notifyBeforeMinutes: dto.notifyBeforeMinutes ?? 30,
    });

    return this.prisma.routeSchedule.create({
      data: {
        routeId: dto.routeId,
        busId: dto.busId,
        type: dto.type,
        title: dto.title?.trim() || null,
        departureTime,
        dayOfWeek: dto.dayOfWeek ?? null,
        notifyBeforeMinutes: dto.notifyBeforeMinutes ?? 30,
        departureMinutes: metadata.departureMinutes,
        notificationTimeMinutes: metadata.notificationTimeMinutes,
        notificationDayOfWeek: metadata.notificationDayOfWeek,
      },
      include: {
        bus: {
          select: {
            id: true,
            plate: true,
          },
        },
      },
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
        orderBy: [{ dayOfWeek: 'asc' }, { departureTime: 'asc' }],
        include: {
          bus: {
            select: {
              id: true,
              plate: true,
            },
          },
        },
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
      include: {
        bus: {
          select: {
            id: true,
            plate: true,
          },
        },
      },
    });

    if (!schedule) {
      throw new NotFoundException('Horario nao encontrado');
    }

    return schedule;
  }

  async update(companyId: string, id: string, dto: UpdateScheduleDto) {
    const currentSchedule = await this.findOne(companyId, id);
    await this.ensureBusBelongsToCompany(companyId, dto.busId);
    const departureTime =
      dto.departureTime !== undefined
        ? new Date(dto.departureTime)
        : currentSchedule.departureTime;
    const dayOfWeek =
      dto.dayOfWeek !== undefined ? dto.dayOfWeek : currentSchedule.dayOfWeek;
    const notifyBeforeMinutes =
      dto.notifyBeforeMinutes !== undefined
        ? dto.notifyBeforeMinutes
        : currentSchedule.notifyBeforeMinutes;
    const metadata = getScheduleMetadata({
      departureTime,
      dayOfWeek,
      notifyBeforeMinutes,
    });

    return this.prisma.routeSchedule.update({
      where: { id },
      data: {
        ...(dto.busId !== undefined ? { busId: dto.busId } : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.title !== undefined ? { title: dto.title.trim() || null } : {}),
        departureTime,
        ...(dto.dayOfWeek !== undefined ? { dayOfWeek: dto.dayOfWeek } : {}),
        notifyBeforeMinutes,
        departureMinutes: metadata.departureMinutes,
        notificationTimeMinutes: metadata.notificationTimeMinutes,
        notificationDayOfWeek: metadata.notificationDayOfWeek,
        ...(dto.active !== undefined ? { active: dto.active } : {}),
      },
      include: {
        bus: {
          select: {
            id: true,
            plate: true,
          },
        },
      },
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
}
