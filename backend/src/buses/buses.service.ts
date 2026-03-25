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
    } catch (error) {
      throw new BadRequestException('Placa já cadastrada');
    }
  }

  async findAll(companyId: string) {
    return this.prisma.bus.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
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
    } catch (error) {
      throw new BadRequestException('Placa já cadastrada');
    }
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);

    return this.prisma.bus.delete({
      where: { id },
    });
  }
}
