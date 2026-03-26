import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBusDto } from './dto/create-bus.dto';
import { UpdateBusDto } from './dto/update-bus.dto';

@Injectable()
export class BusesService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, dto: CreateBusDto) {
    try {
      return await this.prisma.bus.create({
        data: {
          ...dto,
          plate: dto.plate.toUpperCase(),
          companyId,
        },
      });
    } catch (err) {
      if (err.code === 'P2002') {
        throw new BadRequestException('Placa já cadastrada');
      }
      throw err;
    }
  }

  async findAll({
    page = 1,
    limit = 10,
    companyId,
    search,
  }: {
    page?: number;
    limit?: number;
    companyId: string;
    search?: string;
  }) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.bus.findMany({
        where: {
          companyId,
          ...(search && {
            plate: {
              contains: search,
              mode: 'insensitive',
            },
          }),
        },
        skip,
        take: limit,
      }),
      this.prisma.bus.count({
        where: {
          companyId,
          ...(search && {
            plate: {
              contains: search,
              mode: 'insensitive',
            },
          }),
        },
      }),
    ]);

    return {
      data,
      total,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOne(companyId: string, id: string) {
    const bus = await this.prisma.bus.findFirst({
      where: { id, companyId },
    });

    if (!bus) {
      throw new BadRequestException('Ônibus não encontrado');
    }

    return bus;
  }

  async update(companyId: string, id: string, dto: UpdateBusDto) {
    await this.findOne(companyId, id);

    try {
      return await this.prisma.bus.update({
        where: { id },
        data: {
          ...dto,
          plate: dto.plate?.toUpperCase(),
        },
      });
    } catch (err) {
      if (err.code === 'P2002') {
        throw new BadRequestException('Placa já cadastrada');
      }
      throw err;
    }
  }

  async deleteMany(ids: string[]) {
    return this.prisma.bus.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
  }
}
