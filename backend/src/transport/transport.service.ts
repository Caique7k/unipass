import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BoardingDto } from './dto/boarding.dto';
import { IotBoardingDto } from './dto/iot-boarding.dto';

@Injectable()
export class TransportService {
  constructor(private readonly prisma: PrismaService) {}

  private async validateDevice(deviceIdentifier: string) {
    const device = await this.prisma.device.findUnique({
      where: { code: deviceIdentifier },
    });

    if (!device) {
      throw new NotFoundException('Device nao encontrado');
    }

    if (!device.active) {
      throw new BadRequestException('Device inativo');
    }

    if (!device.companyId) {
      throw new BadRequestException('Device nao vinculado');
    }

    return device;
  }

  private async validateDeviceCredentials(code: string, secret: string) {
    const device = await this.prisma.device.findUnique({
      where: { code },
    });

    if (!device || device.secret !== secret) {
      throw new NotFoundException('Credenciais do device invalidas');
    }

    if (!device.active) {
      throw new BadRequestException('Device inativo');
    }

    if (!device.companyId) {
      throw new BadRequestException('Device ainda nao foi vinculado no painel');
    }

    return device;
  }

  private async getCardWithStudent(tag: string, companyId: string) {
    return this.prisma.rfidCard.findFirst({
      where: {
        tag,
        companyId,
      },
      include: {
        student: true,
      },
    });
  }

  private async processBoarding(device: any, rfidTag: string) {
    const card = await this.getCardWithStudent(rfidTag, device.companyId);

    if (!card || !card.student) {
      await this.logDenied(device, card);
      throw new ForbiddenException('TAG nao autorizada');
    }

    const student = card.student;

    if (!student.active) {
      await this.logDenied(device, card, student.id);
      throw new ForbiddenException('Aluno inativo');
    }

    const lastEvent = await this.prisma.transportEvent.findFirst({
      where: {
        studentId: student.id,
        deviceId: device.id,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (lastEvent?.type === 'BOARDING') {
      throw new BadRequestException('Aluno ja esta no onibus');
    }

    const event = await this.prisma.transportEvent.create({
      data: {
        type: 'BOARDING',
        studentId: student.id,
        rfidCardId: card.id,
        deviceId: device.id,
        companyId: device.companyId!,
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

  private async processDeboarding(device: any, rfidTag: string) {
    const card = await this.getCardWithStudent(rfidTag, device.companyId);

    if (!card || !card.student) {
      throw new ForbiddenException('TAG nao autorizada');
    }

    const student = card.student;

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
      throw new BadRequestException('Aluno nao esta no onibus');
    }

    const event = await this.prisma.transportEvent.create({
      data: {
        type: 'DEBOARDING',
        studentId: student.id,
        rfidCardId: card.id,
        deviceId: device.id,
        companyId: device.companyId!,
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

  async registerBoarding(dto: BoardingDto) {
    const device = await this.validateDevice(dto.deviceIdentifier);
    return this.processBoarding(device, dto.rfidTag);
  }

  async registerIotBoarding(dto: IotBoardingDto) {
    const device = await this.validateDeviceCredentials(dto.code, dto.secret);
    return this.processBoarding(device, dto.rfidTag);
  }

  async registerDeboarding(dto: BoardingDto) {
    const device = await this.validateDevice(dto.deviceIdentifier);
    return this.processDeboarding(device, dto.rfidTag);
  }

  async registerIotDeboarding(dto: IotBoardingDto) {
    const device = await this.validateDeviceCredentials(dto.code, dto.secret);
    return this.processDeboarding(device, dto.rfidTag);
  }

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
