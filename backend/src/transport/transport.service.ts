import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BoardingDto } from './dto/boarding.dto';

@Injectable()
export class TransportService {
  constructor(private readonly prisma: PrismaService) {}

  // 🔵 EMBARQUE
  async registerBoarding(dto: BoardingDto) {
    const { deviceIdentifier, rfidTag } = dto;

    // 1️⃣ device
    const device = await this.prisma.device.findUnique({
      where: { identifier: deviceIdentifier },
    });

    if (!device) {
      throw new NotFoundException('Device não encontrado');
    }

    // 2️⃣ tag + aluno
    const card = await this.prisma.rfidCard.findFirst({
      where: {
        tag: rfidTag,
        companyId: device.companyId,
      },
      include: {
        student: true,
      },
    });

    if (!card || !card.student) {
      await this.logDenied(device, card);
      throw new ForbiddenException('TAG não autorizada');
    }

    const student = card.student;

    // 3️⃣ aluno ativo
    if (!student.active) {
      await this.logDenied(device, card, student.id);
      throw new ForbiddenException('Aluno inativo');
    }

    // 4️⃣ evitar embarque duplicado (REGRA IMPORTANTE)
    const lastEvent = await this.prisma.transportEvent.findFirst({
      where: {
        studentId: student.id,
        deviceId: device.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (lastEvent?.type === 'BOARDING') {
      throw new BadRequestException('Aluno já está no ônibus');
    }

    // 5️⃣ registrar embarque
    const event = await this.prisma.transportEvent.create({
      data: {
        type: 'BOARDING',
        studentId: student.id,
        rfidCardId: card.id,
        deviceId: device.id,
        companyId: device.companyId,
      },
    });

    return {
      status: 'AUTHORIZED',
      action: 'BOARDING',
      student: {
        id: student.id,
        name: student.name,
      },
      timestamp: event.createdAt,
    };
  }

  // 🔴 DESEMBARQUE
  async registerDeboarding(dto: BoardingDto) {
    const { deviceIdentifier, rfidTag } = dto;

    const device = await this.prisma.device.findUnique({
      where: { identifier: deviceIdentifier },
    });

    if (!device) {
      throw new NotFoundException('Device não encontrado');
    }

    const card = await this.prisma.rfidCard.findFirst({
      where: {
        tag: rfidTag,
        companyId: device.companyId,
      },
      include: {
        student: true,
      },
    });

    if (!card || !card.student) {
      throw new ForbiddenException('TAG não autorizada');
    }

    const student = card.student;

    // 🔥 verificar se está no ônibus
    const lastEvent = await this.prisma.transportEvent.findFirst({
      where: {
        studentId: student.id,
        deviceId: device.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!lastEvent || lastEvent.type !== 'BOARDING') {
      throw new BadRequestException('Aluno não está no ônibus');
    }

    // registrar saída
    const event = await this.prisma.transportEvent.create({
      data: {
        type: 'DEBOARDING',
        studentId: student.id,
        rfidCardId: card.id,
        deviceId: device.id,
        companyId: device.companyId,
      },
    });

    return {
      status: 'AUTHORIZED',
      action: 'DEBOARDING',
      student: {
        id: student.id,
        name: student.name,
      },
      timestamp: event.createdAt,
    };
  }

  // 🟡 helper para logs negados
  private async logDenied(device: any, card?: any, studentId?: string) {
    await this.prisma.transportEvent.create({
      data: {
        type: 'DENIED',
        deviceId: device.id,
        companyId: device.companyId,
        rfidCardId: card?.id || undefined,
        studentId: studentId || undefined,
      },
    });
  }
}
