import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LinkRfidDto } from './dto/link-rfid.dto';

@Injectable()
export class RfidService {
  constructor(private readonly prisma: PrismaService) {}

  async link(companyId: string, dto: LinkRfidDto) {
    const { studentId, rfidTag } = dto;

    // 1️⃣ aluno existe?
    const student = await this.prisma.student.findFirst({
      where: {
        id: studentId,
        companyId,
      },
    });

    if (!student) {
      throw new NotFoundException('Aluno não encontrado');
    }

    // 2️⃣ tag já existe?
    const existingTag = await this.prisma.rfidCard.findUnique({
      where: { tag: rfidTag },
    });

    if (existingTag) {
      throw new BadRequestException('TAG já cadastrada');
    }

    // 3️⃣ criar vínculo
    return this.prisma.rfidCard.create({
      data: {
        tag: rfidTag,
        studentId,
        companyId,
      },
    });
  }
}
