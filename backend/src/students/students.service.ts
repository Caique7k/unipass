import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string, search?: string) {
    return this.prisma.student.findMany({
      where: {
        companyId,
        ...(search && {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        }),
      },
      orderBy: { createdAt: 'desc' },
    });
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
