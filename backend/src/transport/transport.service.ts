import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BoardingDto } from './dto/boarding.dto';

@Injectable()
export class TransportService {
  constructor(private readonly prisma: PrismaService) {}

  async registerBoarding(dto: BoardingDto) {
    const { deviceIdentifier, rfidTag } = dto;

    // 1️⃣ Buscar device
    const device = await this.prisma.device.findUnique({
      where: { identifier: deviceIdentifier },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    // 2️⃣ Buscar cartão dentro da empresa correta
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
      await this.prisma.transportEvent.create({
        data: {
          type: 'DENIED',
          deviceId: device.id,
          companyId: device.companyId,
          rfidCardId: card?.id ?? '',
          studentId: card?.studentId ?? '',
        },
      });

      throw new ForbiddenException('Card not authorized');
    }

    // 3️⃣ Registrar evento
    const event = await this.prisma.transportEvent.create({
      data: {
        type: 'BOARDING',
        studentId: card.student.id,
        rfidCardId: card.id,
        deviceId: device.id,
        companyId: device.companyId,
      },
    });

    return {
      status: 'AUTHORIZED',
      student: {
        id: card.student.id,
        name: card.student.name,
      },
      timestamp: event.createdAt,
    };
  }
}
