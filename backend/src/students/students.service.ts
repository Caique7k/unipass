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

  async findAll({
    page,
    limit,
    search,
    active,
  }: {
    page: number;
    limit: number;
    search?: string;
    active?: boolean;
  }) {
    const skip = (page - 1) * limit;

    const where: Prisma.StudentWhereInput = {
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
        include: {
          rfidCards: true,
        },
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
    });

    if (!student) throw new NotFoundException('Aluno não encontrado');

    return student;
  }

  async create(companyId: string, dto: CreateStudentDto) {
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

      const student = await tx.student.create({
        data: {
          companyId,
          name: dto.name,
          registration: dto.registration,
          active: dto.active ?? true,
          email: dto.email ?? null,
          phone: dto.phone ?? null,
        },
      });

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

    return this.prisma.student.update({
      where: { id },
      data: {
        name: dto.name ?? student.name,
        registration: dto.registration ?? student.registration,
        active: dto.active ?? student.active,
        email: dto.email ?? student.email,
        phone: dto.phone ?? student.phone,
      },
    });
  }

  async deleteMany(ids: string[]) {
    return this.prisma.student.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
  }
  async desactivateMany(ids: string[]) {
    return this.prisma.student.updateMany({
      where: {
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
