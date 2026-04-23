import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';

@Injectable()
export class RoutesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreateRouteDto) {
    await this.ensureRouteNameAvailable(companyId, dto.name);

    return this.prisma.route.create({
      data: {
        name: dto.name,
        description: dto.description || null,
        companyId,
      },
    });
  }

  async findAll({
    companyId,
    page = 1,
    limit = 10,
    search,
    active,
  }: {
    companyId: string;
    page?: number;
    limit?: number;
    search?: string;
    active?: boolean;
  }) {
    const normalizedPage = page > 0 ? page : 1;
    const normalizedLimit = limit > 0 ? limit : 10;
    const skip = (normalizedPage - 1) * normalizedLimit;
    const normalizedSearch = search?.trim();
    const where: Prisma.RouteWhereInput = {
      companyId,
      ...(active !== undefined ? { active } : {}),
      ...(normalizedSearch
        ? {
            OR: [
              {
                name: {
                  contains: normalizedSearch,
                  mode: 'insensitive',
                },
              },
              {
                description: {
                  contains: normalizedSearch,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.route.findMany({
        where,
        skip,
        take: normalizedLimit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              schedules: true,
            },
          },
        },
      }),
      this.prisma.route.count({ where }),
    ]);

    return {
      data,
      total,
      page: normalizedPage,
      lastPage: Math.max(1, Math.ceil(total / normalizedLimit)),
    };
  }

  async findOne(companyId: string, id: string) {
    const route = await this.prisma.route.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        _count: {
          select: {
            schedules: true,
          },
        },
      },
    });

    if (!route) {
      throw new NotFoundException('Rota não encontrada.');
    }

    return route;
  }

  async update(companyId: string, id: string, dto: UpdateRouteDto) {
    const currentRoute = await this.findOne(companyId, id);

    if (dto.name === undefined && dto.description === undefined) {
      throw new BadRequestException('Nenhum dado informado para atualizacao');
    }

    if (dto.name !== undefined) {
      await this.ensureRouteNameAvailable(companyId, dto.name, id);
    }

    return this.prisma.route.update({
      where: { id },
      data: {
        name: dto.name ?? currentRoute.name,
        ...(dto.description !== undefined
          ? {
              description: dto.description || null,
            }
          : {}),
      },
      include: {
        _count: {
          select: {
            schedules: true,
          },
        },
      },
    });
  }

  async deactivateMany(companyId: string, ids: string[]) {
    return this.prisma.route.updateMany({
      where: {
        companyId,
        id: {
          in: ids,
        },
      },
      data: {
        active: false,
      },
    });
  }

  private async ensureRouteNameAvailable(
    companyId: string,
    name: string,
    excludeId?: string,
  ) {
    const existingRoute = await this.prisma.route.findFirst({
      where: {
        companyId,
        ...(excludeId
          ? {
              id: {
                not: excludeId,
              },
            }
          : {}),
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
      },
    });

    if (existingRoute) {
      throw new BadRequestException('Já existe uma rota com esse nome.');
    }
  }
}
