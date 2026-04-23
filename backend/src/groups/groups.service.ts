import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreateGroupDto) {
    const name = this.normalizeName(dto.name);

    try {
      return await this.prisma.group.create({
        data: {
          companyId,
          name,
          nameNormalized: this.normalizeNameForKey(name),
        },
      });
    } catch (error) {
      this.handleUniqueNameError(error);
    }
  }

  async findAll(params: {
    companyId: string;
    page?: number;
    limit?: number;
    search?: string;
    active?: boolean;
  }) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? params.limit : 10;
    const skip = (page - 1) * limit;
    const normalizedSearch = params.search?.trim();

    const where: Prisma.GroupWhereInput = {
      companyId: params.companyId,
      ...(params.active !== undefined ? { active: params.active } : {}),
      ...(normalizedSearch
        ? {
            name: {
              contains: normalizedSearch,
              mode: 'insensitive',
            },
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.group.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ active: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.group.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      lastPage: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async findOne(companyId: string, id: string) {
    const group = await this.prisma.group.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!group) {
      throw new NotFoundException('Grupo não encontrado.');
    }

    return group;
  }

  async update(companyId: string, id: string, dto: UpdateGroupDto) {
    await this.findOne(companyId, id);

    const data: Prisma.GroupUpdateInput = {
      ...(dto.name !== undefined
        ? {
            name: this.normalizeName(dto.name),
            nameNormalized: this.normalizeNameForKey(dto.name),
          }
        : {}),
      ...(dto.active !== undefined ? { active: dto.active } : {}),
    };

    try {
      return await this.prisma.group.update({
        where: { id },
        data,
      });
    } catch (error) {
      this.handleUniqueNameError(error);
    }
  }

  async deactivateMany(companyId: string, ids: string[]) {
    const result = await this.prisma.group.updateMany({
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

    if (result.count === 0) {
      throw new NotFoundException('Nenhum grupo encontrado para desativar.');
    }

    return result;
  }

  private normalizeName(value: string) {
    const name = value.trim().replace(/\s+/g, ' ');

    if (!name) {
      throw new BadRequestException('Informe o nome do grupo');
    }

    return name;
  }

  private normalizeNameForKey(value: string) {
    return this.normalizeName(value).toLocaleLowerCase('pt-BR');
  }

  private handleUniqueNameError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new BadRequestException('Já existe um grupo com esse nome.');
    }

    throw error;
  }
}
