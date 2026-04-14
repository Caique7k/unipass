import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  private readonly studentDetailsInclude = {
    rfidCards: true,
    group: {
      select: {
        id: true,
        name: true,
        active: true,
      },
    },
    routes: {
      select: {
        route: {
          select: {
            id: true,
            name: true,
            active: true,
          },
        },
      },
    },
  } satisfies Prisma.StudentInclude;

  async findAll({
    companyId,
    page,
    limit,
    search,
    active,
  }: {
    companyId: string;
    page: number;
    limit: number;
    search?: string;
    active?: boolean;
  }) {
    const skip = (page - 1) * limit;

    const where: Prisma.StudentWhereInput = {
      companyId,
      ...(search && {
        OR: [
          {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            registration: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ],
      }),

      ...(active !== undefined && {
        active,
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: this.studentDetailsInclude,
      }),
      this.prisma.student.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      lastPage: limit > 0 ? Math.ceil(total / limit) : 1,
    };
  }

  async findOne(companyId: string, id: string) {
    const student = await this.prisma.student.findFirst({
      where: { id, companyId },
      include: this.studentDetailsInclude,
    });

    if (!student) throw new NotFoundException('Aluno não encontrado');

    return student;
  }

  async create(companyId: string, dto: CreateStudentDto) {
    const company = await this.getCompanyOrFail(companyId);
    const group = await this.getAssignableGroupOrFail(companyId, dto.groupId);
    const routeIds = await this.getAssignableRouteIdsOrFail(
      companyId,
      dto.routeIds,
    );
    const normalizedEmail = this.normalizeStudentEmail(
      dto.email,
      company.emailDomain,
    );

    return this.prisma.$transaction(async (tx) => {
      const exists = await tx.student.findFirst({
        where: {
          companyId,
          registration: dto.registration,
        },
      });

      if (exists) {
        throw new BadRequestException('Matrícula já cadastrada');
      }

      if (dto.rfidTag) {
        const existingTag = await tx.rfidCard.findUnique({
          where: { tag: dto.rfidTag },
        });

        if (existingTag) {
          throw new BadRequestException('RFID já cadastrado');
        }
      }

      let student;

      try {
        student = await tx.student.create({
          data: {
            companyId,
            groupId: group.id,
            name: dto.name,
            registration: dto.registration,
            active: dto.active ?? true,
            email: normalizedEmail,
            phone: dto.phone ?? null,
            routes: {
              createMany: {
                data: routeIds.map((routeId) => ({ routeId })),
              },
            },
          },
          include: this.studentDetailsInclude,
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          throw new BadRequestException(
            normalizedEmail
              ? 'Ja existe um aluno com esse email neste dominio.'
              : 'Matricula ja cadastrada',
          );
        }

        throw error;
      }

      if (dto.rfidTag) {
        await tx.rfidCard.create({
          data: {
            tag: dto.rfidTag,
            studentId: student.id,
            companyId,
          },
        });
      }

      return student;
    });
  }

  async update(companyId: string, id: string, dto: UpdateStudentDto) {
    const student = await this.findOne(companyId, id);
    const company = await this.getCompanyOrFail(companyId);
    const nextGroupId =
      dto.groupId === undefined
        ? student.groupId
        : await this.resolveNextGroupId(companyId, student, dto.groupId);
    const nextRouteIds =
      dto.routeIds === undefined
        ? student.routes.map((studentRoute) => studentRoute.route.id)
        : await this.getAssignableRouteIdsOrFail(companyId, dto.routeIds);
    const nextEmail =
      dto.email !== undefined
        ? this.normalizeStudentEmail(dto.email, company.emailDomain)
        : student.email;

    try {
      return await this.prisma.$transaction(async (tx) => {
        await tx.student.update({
          where: { id },
          data: {
            name: dto.name ?? student.name,
            registration: dto.registration ?? student.registration,
            active: dto.active ?? student.active,
            groupId: nextGroupId,
            email: nextEmail,
            phone: dto.phone ?? student.phone,
          },
        });

        await tx.studentRoute.deleteMany({
          where: {
            studentId: id,
          },
        });

        await tx.studentRoute.createMany({
          data: nextRouteIds.map((routeId) => ({
            studentId: id,
            routeId,
          })),
        });

        return tx.student.findUniqueOrThrow({
          where: { id },
          include: this.studentDetailsInclude,
        });
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('Matrícula já cadastrada');
      }

      throw error;
    }
  }

  async deleteMany(companyId: string, ids: string[]) {
    return this.prisma.student.deleteMany({
      where: {
        companyId,
        id: {
          in: ids,
        },
      },
    });
  }
  async desactivateMany(companyId: string, ids: string[]) {
    return this.prisma.student.updateMany({
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

  async findUserCandidates(companyId: string, includeUserId?: string) {
    return this.prisma.student.findMany({
      where: {
        companyId,
        OR: [
          {
            active: true,
            email: {
              not: null,
            },
            user: null,
          },
          ...(includeUserId
            ? [
                {
                  user: {
                    is: {
                      id: includeUserId,
                    },
                  },
                },
              ]
            : []),
        ],
      },
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        email: true,
        registration: true,
      },
    });
  }

  private async getCompanyOrFail(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: {
        id: companyId,
      },
      select: {
        id: true,
        emailDomain: true,
      },
    });

    if (!company) {
      throw new NotFoundException('Empresa nao encontrada');
    }

    return company;
  }

  private async getAssignableGroupOrFail(companyId: string, groupId: string) {
    const group = await this.prisma.group.findFirst({
      where: {
        id: groupId,
        companyId,
        active: true,
      },
      select: {
        id: true,
      },
    });

    if (!group) {
      throw new BadRequestException(
        'Selecione um grupo ativo e valido para o colaborador.',
      );
    }

    return group;
  }

  private async resolveNextGroupId(
    companyId: string,
    student: Awaited<ReturnType<StudentsService['findOne']>>,
    groupId: string,
  ) {
    if (groupId === student.groupId) {
      return student.groupId;
    }

    const group = await this.getAssignableGroupOrFail(companyId, groupId);

    return group.id;
  }

  private async getAssignableRouteIdsOrFail(
    companyId: string,
    routeIds: string[],
  ) {
    const uniqueRouteIds = Array.from(
      new Set(routeIds.map((routeId) => routeId.trim()).filter(Boolean)),
    );

    if (uniqueRouteIds.length === 0) {
      throw new BadRequestException(
        'Selecione pelo menos uma rota ativa para o colaborador.',
      );
    }

    const routes = await this.prisma.route.findMany({
      where: {
        id: {
          in: uniqueRouteIds,
        },
        companyId,
        active: true,
      },
      select: {
        id: true,
      },
    });

    if (routes.length !== uniqueRouteIds.length) {
      throw new BadRequestException(
        'Selecione apenas rotas ativas e validas para o colaborador.',
      );
    }

    return uniqueRouteIds;
  }

  private normalizeStudentEmail(email: string | undefined, domain: string) {
    if (!email?.trim()) {
      return null;
    }

    const normalized = email.trim().toLowerCase();
    const expectedSuffix = `@${domain.toLowerCase()}`;

    if (normalized.includes('@')) {
      if (!normalized.endsWith(expectedSuffix)) {
        throw new BadRequestException(
          `O email do aluno deve usar o dominio da empresa (${expectedSuffix}).`,
        );
      }

      return normalized;
    }

    if (!/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/.test(normalized)) {
      throw new BadRequestException(
        'Use apenas letras, numeros, ponto, underline ou hifen antes do dominio.',
      );
    }

    return `${normalized}${expectedSuffix}`;
  }
}
