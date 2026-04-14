import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

@Injectable()
export class RouteSchedulesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateScheduleDto) {
    return this.prisma.routeSchedule.create({
      data: {
        ...dto,
        departureTime: new Date(dto.departureTime),
      },
    });
  }

  async findByRoute(routeId: string) {
    return this.prisma.routeSchedule.findMany({
      where: { routeId },
      orderBy: { departureTime: 'asc' },
    });
  }

  async update(id: string, dto: UpdateScheduleDto) {
    return this.prisma.routeSchedule.update({
      where: { id },
      data: {
        ...dto,
        departureTime: dto.departureTime
          ? new Date(dto.departureTime)
          : undefined,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.routeSchedule.delete({
      where: { id },
    });
  }
}
