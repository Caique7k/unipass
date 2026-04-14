import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { Prisma } from '@prisma/client';
import { UpdateRouteDto } from './dto/update-route.dto';

@Injectable()
export class RoutesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreateRouteDto) {
    const name = dto.name.trim();

    if (!name) {
      throw new BadRequestException('Informe o nome da rota');
    }

    return this.prisma.route.create({
      data: {
        name,
        description: dto.description?.trim() || null,
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
      throw new NotFoundException('Rota nao encontrada');
    }

    return route;
  }

  async update(companyId: string, id: string, dto: UpdateRouteDto) {
    await this.findOne(companyId, id);

    if (!dto.name && dto.description === undefined) {
      throw new BadRequestException('Nenhum dado informado para atualizacao');
    }

    if (dto.name !== undefined && !dto.name.trim()) {
      throw new BadRequestException('Informe o nome da rota');
    }

    return this.prisma.route.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined
          ? {
              description: dto.description.trim() || null,
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
}
