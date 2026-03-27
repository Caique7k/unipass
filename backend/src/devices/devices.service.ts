import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { CreateDeviceDto } from './dto/create-device.dto';
import { LinkDeviceDto } from './dto/link-device.dto';
import { ListDevicesDto } from './dto/find-devices.dto';
import { DeleteDevicesDto } from './dto/delete-devices.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

function generateCode() {
  return 'UNP-' + Math.random().toString(36).substring(2, 10).toUpperCase();
}

function generateSecret() {
  return randomBytes(16).toString('hex');
}
@Injectable()
export class DevicesService {
  constructor(private prisma: PrismaService) {}
  async create(dto: CreateDeviceDto) {
    return this.prisma.device.create({
      data: {
        code: generateCode(),
        secret: generateSecret(),
      },
    });
  }
  async linkDevice(user, dto: LinkDeviceDto) {
    const device = await this.prisma.device.findUnique({
      where: { code: dto.code },
    });

    if (!device) {
      throw new NotFoundException('Device não encontrado');
    }

    if (device.companyId) {
      throw new BadRequestException('Device já vinculado');
    }

    return this.prisma.device.update({
      where: { id: device.id },
      data: {
        companyId: user.companyId,
        name: dto.name,
      },
    });
  }
  async findAll(user, query: ListDevicesDto) {
    const { page = 1, limit = 10, search, active } = query;

    const where: any = {
      companyId: user.companyId,
    };

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    if (active !== undefined) {
      where.active = active;
    }

    const [data, total] = await Promise.all([
      this.prisma.device.findMany({
        where,
        skip: (page - 1) * limit,
        take: Number(limit),
        include: { bus: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.device.count({ where }),
    ]);

    return {
      data,
      lastPage: Math.ceil(total / limit),
    };
  }
  async deleteMany(user, dto: DeleteDevicesDto) {
    return this.prisma.device.updateMany({
      where: {
        id: { in: dto.ids },
        companyId: user.companyId,
      },
      data: {
        active: false,
      },
    });
  }
}
