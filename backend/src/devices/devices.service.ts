import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ClaimDevicePairingDto } from './dto/claim-device-pairing.dto';
import { DeleteDevicesDto } from './dto/delete-devices.dto';
import { LinkDeviceDto } from './dto/link-device.dto';
import { ListDevicesDto } from './dto/find-devices.dto';
import { StartDevicePairingDto } from './dto/start-device-pairing.dto';

const PAIRING_TTL_MINUTES = 10;

function generateCode() {
  return `UNP-${randomBytes(4).toString('hex').toUpperCase()}`;
}

function generateSecret() {
  return randomBytes(16).toString('hex');
}

function generatePairingCode() {
  return randomBytes(3).toString('hex').toUpperCase();
}

@Injectable()
export class DevicesService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateUniqueDeviceCode() {
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateCode();
      const existingDevice = await this.prisma.device.findUnique({
        where: { code },
      });

      if (!existingDevice) {
        return code;
      }
    }

    throw new BadRequestException(
      'Não foi possível gerar um código único para o dispositivo.',
    );
  }

  private async generateUniquePairingCode() {
    for (let attempt = 0; attempt < 5; attempt++) {
      const pairingCode = generatePairingCode();
      const existingDevice = await this.prisma.device.findUnique({
        where: { pairingCode },
      });

      if (!existingDevice) {
        return pairingCode;
      }
    }

    throw new BadRequestException(
      'Não foi possível gerar um código temporário para o dispositivo.',
    );
  }

  private getPairingExpiresAt() {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + PAIRING_TTL_MINUTES);
    return expiresAt;
  }

  private isPairingValid(device: {
    pairingCode: string | null;
    pairingCodeExpiresAt: Date | null;
  }) {
    return Boolean(
      device.pairingCode &&
      device.pairingCodeExpiresAt &&
      device.pairingCodeExpiresAt > new Date(),
    );
  }

  async startPairing(dto: StartDevicePairingDto) {
    const existingDevice = await this.prisma.device.findUnique({
      where: { hardwareId: dto.hardwareId },
    });

    if (!existingDevice) {
      const pairingCode = await this.generateUniquePairingCode();
      const device = await this.prisma.device.create({
        data: {
          hardwareId: dto.hardwareId,
          pairingCode,
          pairingCodeExpiresAt: this.getPairingExpiresAt(),
          active: true,
        },
      });

      return {
        hardwareId: device.hardwareId,
        pairingCode: device.pairingCode,
        pairingCodeExpiresAt: device.pairingCodeExpiresAt,
        linked: false,
        credentialsReady: false,
      };
    }

    if (!existingDevice.active) {
      throw new BadRequestException('Device inativo');
    }

    if (
      existingDevice.code &&
      existingDevice.secret &&
      existingDevice.pairedAt
    ) {
      return {
        hardwareId: existingDevice.hardwareId,
        linked: Boolean(existingDevice.companyId),
        credentialsReady: true,
        alreadyPaired: true,
      };
    }

    if (this.isPairingValid(existingDevice)) {
      return {
        hardwareId: existingDevice.hardwareId,
        pairingCode: existingDevice.pairingCode,
        pairingCodeExpiresAt: existingDevice.pairingCodeExpiresAt,
        linked: Boolean(existingDevice.companyId),
        credentialsReady: Boolean(
          existingDevice.companyId &&
          existingDevice.code &&
          existingDevice.secret,
        ),
      };
    }

    const pairingCode = await this.generateUniquePairingCode();
    const device = await this.prisma.device.update({
      where: { id: existingDevice.id },
      data: {
        pairingCode,
        pairingCodeExpiresAt: this.getPairingExpiresAt(),
      },
    });

    return {
      hardwareId: device.hardwareId,
      pairingCode: device.pairingCode,
      pairingCodeExpiresAt: device.pairingCodeExpiresAt,
      linked: Boolean(device.companyId),
      credentialsReady: Boolean(
        device.companyId && device.code && device.secret,
      ),
    };
  }

  async claimPairing(dto: ClaimDevicePairingDto) {
    const device = await this.prisma.device.findUnique({
      where: { hardwareId: dto.hardwareId },
    });

    if (!device) {
      throw new NotFoundException('Dispositivo não encontrado.');
    }

    if (!device.active) {
      throw new BadRequestException('Device inativo');
    }

    if (
      device.pairingCode !== dto.pairingCode ||
      !device.pairingCodeExpiresAt ||
      device.pairingCodeExpiresAt <= new Date()
    ) {
      throw new BadRequestException('Código temporário inválido ou expirado.');
    }

    if (!device.companyId || !device.code || !device.secret) {
      return {
        linked: false,
        credentialsReady: false,
      };
    }

    const updatedDevice = await this.prisma.device.update({
      where: { id: device.id },
      data: {
        pairedAt: new Date(),
        pairingCode: null,
        pairingCodeExpiresAt: null,
      },
    });

    return {
      linked: true,
      credentialsReady: true,
      code: updatedDevice.code,
      secret: updatedDevice.secret,
      name: updatedDevice.name,
      companyId: updatedDevice.companyId,
    };
  }

  async linkDevice(user, dto: LinkDeviceDto) {
    const device = await this.prisma.device.findUnique({
      where: { pairingCode: dto.pairingCode },
    });

    if (
      !device ||
      !device.pairingCodeExpiresAt ||
      device.pairingCodeExpiresAt <= new Date()
    ) {
      throw new NotFoundException(
        'Código temporário não encontrado ou expirado.',
      );
    }

    if (device.companyId && device.companyId !== user.companyId) {
      throw new BadRequestException('Dispositivo já vinculado a outra empresa.');
    }

    const bus = await this.prisma.bus.findFirst({
      where: {
        id: dto.busId,
        companyId: user.companyId,
      },
    });

    if (!bus) {
      throw new NotFoundException('Ônibus não encontrado.');
    }

    const data: {
      companyId?: string;
      name: string;
      busId: string;
      code?: string;
      secret?: string;
    } = {
      name: bus.plate,
      busId: bus.id,
    };

    if (!device.companyId) {
      data.companyId = user.companyId;
    }

    if (!device.code) {
      data.code = await this.generateUniqueDeviceCode();
    }

    if (!device.secret) {
      data.secret = generateSecret();
    }

    return this.prisma.device.update({
      where: { id: device.id },
      data,
    });
  }

  async findAll(user, query: ListDevicesDto) {
    const { page = 1, limit = 10, search, active } = query;

    const where: any = {
      companyId: user.companyId,
    };

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          code: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          hardwareId: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    if (active !== undefined) {
      where.active = active;
    }

    const [data, total] = await Promise.all([
      this.prisma.device.findMany({
        where,
        skip: (page - 1) * limit,
        take: Number(limit),
        include: { bus: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.device.count({ where }),
    ]);

    return {
      data,
      lastPage: Math.ceil(total / limit),
    };
  }

  async deleteMany(user, dto: DeleteDevicesDto) {
    const result = await this.prisma.device.updateMany({
      where: {
        id: { in: dto.ids },
        companyId: user.companyId,
      },
      data: {
        active: false,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException(
        'Nenhum dispositivo encontrado para desativar.',
      );
    }

    return result;
  }

  async update(user, id: string, dto: { name: string }) {
    const device = await this.prisma.device.findFirst({
      where: {
        id,
        companyId: user.companyId,
      },
    });

    if (!device) {
      throw new NotFoundException('Dispositivo não encontrado.');
    }

    return this.prisma.device.update({
      where: { id },
      data: {
        name: dto.name,
      },
    });
  }

  async linkBus(user, id: string, dto: { busId: string }) {
    const [device, bus] = await Promise.all([
      this.prisma.device.findFirst({
        where: {
          id,
          companyId: user.companyId,
        },
      }),
      this.prisma.bus.findFirst({
        where: {
          id: dto.busId,
          companyId: user.companyId,
        },
      }),
    ]);

    if (!device) {
      throw new NotFoundException('Dispositivo não encontrado.');
    }

    if (!bus) {
      throw new NotFoundException('Ônibus não encontrado.');
    }

    return this.prisma.device.update({
      where: { id },
      data: {
        busId: dto.busId,
        name: bus.plate,
      },
    });
  }
}
