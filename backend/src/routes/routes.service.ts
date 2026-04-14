import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRouteDto } from './dto/create-route.dto';

@Injectable()
export class RoutesService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, dto: CreateRouteDto) {
    return this.prisma.route.create({
      data: {
        ...dto,
        companyId,
      },
    });
  }

  async findAll(companyId: string) {
    return this.prisma.route.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
