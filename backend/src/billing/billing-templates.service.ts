import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BillingTargetScope,
  BillingTemplateRecurrence,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBillingTemplateDto } from './dto/create-billing-template.dto';
import { UpdateBillingTemplateDto } from './dto/update-billing-template.dto';

@Injectable()
export class BillingTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreateBillingTemplateDto) {
    return this.prisma.billingTemplate.create({
      data: {
        companyId,
        name: this.normalizeName(dto.name),
        description: this.normalizeOptionalString(dto.description),
        active: true,
        targetScope: BillingTargetScope.STUDENTS,
        amountCents: dto.amountCents,
        dueDay: dto.dueDay,
        recurrence: dto.recurrence ?? BillingTemplateRecurrence.MONTHLY,
        notifyOnGeneration: dto.notifyOnGeneration ?? true,
      },
      select: this.billingTemplateSelect,
    });
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

    const where: Prisma.BillingTemplateWhereInput = {
      companyId: params.companyId,
      targetScope: {
        in: [
          BillingTargetScope.STUDENTS,
          BillingTargetScope.STUDENTS_AND_COORDINATORS,
        ],
      },
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
      this.prisma.billingTemplate.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ active: 'desc' }, { createdAt: 'desc' }],
        select: this.billingTemplateSelect,
      }),
      this.prisma.billingTemplate.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      lastPage: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async findOne(companyId: string, id: string) {
    const billingTemplate = await this.prisma.billingTemplate.findFirst({
      where: {
        id,
        companyId,
        targetScope: {
          in: [
            BillingTargetScope.STUDENTS,
            BillingTargetScope.STUDENTS_AND_COORDINATORS,
          ],
        },
      },
      select: this.billingTemplateSelect,
    });

    if (!billingTemplate) {
      throw new NotFoundException('Grupo de boletos nao encontrado.');
    }

    return billingTemplate;
  }

  async update(companyId: string, id: string, dto: UpdateBillingTemplateDto) {
    await this.findOne(companyId, id);

    return this.prisma.billingTemplate.update({
      where: { id },
      data: {
        ...(dto.name !== undefined
          ? { name: this.normalizeName(dto.name) }
          : {}),
        ...(dto.description !== undefined
          ? { description: this.normalizeOptionalString(dto.description) }
          : {}),
        ...(dto.amountCents !== undefined
          ? { amountCents: dto.amountCents }
          : {}),
        ...(dto.dueDay !== undefined ? { dueDay: dto.dueDay } : {}),
        ...(dto.recurrence !== undefined ? { recurrence: dto.recurrence } : {}),
        ...(dto.notifyOnGeneration !== undefined
          ? { notifyOnGeneration: dto.notifyOnGeneration }
          : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {}),
      },
      select: this.billingTemplateSelect,
    });
  }

  async deactivateMany(companyId: string, ids: string[]) {
    const result = await this.prisma.billingTemplate.updateMany({
      where: {
        companyId,
        id: {
          in: ids,
        },
        targetScope: {
          in: [
            BillingTargetScope.STUDENTS,
            BillingTargetScope.STUDENTS_AND_COORDINATORS,
          ],
        },
      },
      data: {
        active: false,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException(
        'Nenhum grupo de boletos encontrado para desativar.',
      );
    }

    return result;
  }

  private readonly billingTemplateSelect = {
    id: true,
    name: true,
    description: true,
    active: true,
    targetScope: true,
    amountCents: true,
    dueDay: true,
    recurrence: true,
    notifyOnGeneration: true,
    createdAt: true,
    updatedAt: true,
    _count: {
      select: {
        students: true,
      },
    },
  } satisfies Prisma.BillingTemplateSelect;

  private normalizeName(value: string) {
    const name = value.trim().replace(/\s+/g, ' ');

    if (!name) {
      throw new BadRequestException('Informe o nome do grupo de boletos.');
    }

    return name;
  }

  private normalizeOptionalString(value?: string | null) {
    if (value === undefined || value === null) {
      return undefined;
    }

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }
}
