import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Prisma, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(currentUser: {
    role: UserRole;
    companyId?: string | null;
  }, options?: {
    search?: string;
    active?: boolean;
    role?: string;
    page?: number;
    limit?: number;
  }) {
    if (!currentUser.companyId) {
      return { data: [], total: 0, page: 1, lastPage: 1 };
    }

    const page = options?.page && options.page > 0 ? options.page : 1;
    const limit = options?.limit && options.limit > 0 ? options.limit : 10;
    const search = options?.search?.trim();
    const active = options?.active;
    const skip = (page - 1) * limit;
    const normalizedRole = search
      ? this.normalizeRoleSearch(search)
      : undefined;
    const selectedRole = options?.role
      ? this.normalizeRoleSearch(options.role)
      : undefined;
    const where: Prisma.UserWhereInput = {
      companyId: currentUser.companyId,
      role: {
        not: UserRole.PLATFORM_ADMIN,
      },
      ...(active !== undefined ? { active } : {}),
      ...(selectedRole ? { role: selectedRole } : {}),
      ...(search
        ? {
            OR: [
              {
                name: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                email: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              ...(normalizedRole
                ? [
                    {
                      role: {
                        equals: normalizedRole,
                      },
                    },
                  ]
                : []),
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          active: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      lastPage: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async create(
    currentUser: { companyId?: string | null },
    dto: CreateUserDto,
  ) {
    const company = await this.getCompanyOrFail(currentUser.companyId);

    this.validateCompanyRole(dto.role);
    this.ensureCompanyDomain(dto.email, company.emailDomain);
    await this.ensureCompanyEmailAvailability(dto.email, company.id);

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    try {
      return await this.prisma.user.create({
        data: {
          companyId: company.id,
          name: dto.name,
          email: dto.email.toLowerCase(),
          password: hashedPassword,
          role: dto.role,
          active: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          active: true,
          createdAt: true,
        },
      });
    } catch (error) {
      this.handleUniqueEmail(error);
    }
  }

  async update(
    currentUser: { companyId?: string | null },
    id: string,
    dto: UpdateUserDto,
  ) {
    const company = await this.getCompanyOrFail(currentUser.companyId);

    const user = await this.prisma.user.findFirst({
      where: {
        id,
        companyId: company.id,
        role: {
          not: UserRole.PLATFORM_ADMIN,
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    if (dto.role) {
      this.validateCompanyRole(dto.role);
    }

    if (dto.email) {
      this.ensureCompanyDomain(dto.email, company.emailDomain);
      await this.ensureCompanyEmailAvailability(dto.email, company.id, user.id);
    }

    const data: Prisma.UserUpdateInput = {
      name: dto.name ?? user.name,
      email: dto.email?.toLowerCase() ?? user.email,
      role: dto.role ?? user.role,
      active: dto.active ?? user.active,
    };

    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
    }

    try {
      return await this.prisma.user.update({
        where: { id },
        data,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          active: true,
          createdAt: true,
        },
      });
    } catch (error) {
      this.handleUniqueEmail(error);
    }
  }

  async deactivateMany(currentUser: { companyId?: string | null }, ids: string[]) {
    const company = await this.getCompanyOrFail(currentUser.companyId);

    return this.prisma.user.updateMany({
      where: {
        id: {
          in: ids,
        },
        companyId: company.id,
        role: {
          not: UserRole.PLATFORM_ADMIN,
        },
      },
      data: {
        active: false,
      },
    });
  }

  private async getCompanyOrFail(companyId?: string | null) {
    if (!companyId) {
      throw new BadRequestException('Usuario sem empresa vinculada');
    }

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Empresa nao encontrada');
    }

    return company;
  }

  private validateCompanyRole(role: UserRole) {
    if (role === UserRole.PLATFORM_ADMIN) {
      throw new BadRequestException('Esse perfil so pode ser criado na plataforma');
    }
  }

  private ensureCompanyDomain(email: string, domain: string) {
    const normalizedEmail = email.toLowerCase();
    const expectedSuffix = `@${domain.toLowerCase()}`;
    const emailPattern =
      /^[a-z0-9]+(?:\.[a-z0-9]+)+@[a-z0-9.-]+\.[a-z]{2,}$/;

    if (!normalizedEmail.endsWith(expectedSuffix)) {
      throw new BadRequestException(
        `O email deve usar o dominio da empresa (${expectedSuffix})`,
      );
    }

    if (!emailPattern.test(normalizedEmail)) {
      throw new BadRequestException(
        'Use o formato nome.sobrenome@dominio-da-empresa',
      );
    }
  }

  private async ensureCompanyEmailAvailability(
    email: string,
    companyId: string,
    currentUserId?: string,
  ) {
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findFirst({
      where: {
        companyId,
        email: normalizedEmail,
        ...(currentUserId
          ? {
              id: {
                not: currentUserId,
              },
            }
          : {}),
      },
      select: {
        id: true,
      },
    });

    if (existingUser) {
      throw new BadRequestException(
        'Ja existe um usuario com esse nome de login neste dominio',
      );
    }
  }

  private normalizeRoleSearch(search: string): UserRole | undefined {
    const normalized = search.trim().toUpperCase();

    if (
      normalized === 'ADMIN' ||
      normalized === 'DRIVER' ||
      normalized === 'USER' ||
      normalized === 'COORDINATOR' ||
      normalized === 'PLATFORM_ADMIN'
    ) {
      return normalized as UserRole;
    }

    return undefined;
  }

  private handleUniqueEmail(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new BadRequestException('Email ja cadastrado');
    }

    throw error;
  }
}
