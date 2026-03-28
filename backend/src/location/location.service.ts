import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { DeviceTelemetryDto } from './dto/device-telemetry.dto';

const DEVICE_ONLINE_THRESHOLD_MS = 45_000;

@Injectable()
export class LocationService {
  constructor(private readonly prisma: PrismaService) {}

  async updateDeviceTelemetry(dto: DeviceTelemetryDto) {
    const device = await this.prisma.device.findUnique({
      where: { code: dto.code },
    });

    if (!device || device.secret !== dto.secret) {
      throw new NotFoundException('Credenciais do dispositivo inválidas');
    }

    if (!device.active) {
      throw new BadRequestException('Dispositivo inativo');
    }

    if (!device.companyId) {
      throw new BadRequestException('Dispositivo ainda não vinculado');
    }

    const updatedDevice = await this.prisma.device.update({
      where: { id: device.id },
      data: {
        lastLat: dto.latitude,
        lastLng: dto.longitude,
        lastUpdate: new Date(),
      },
    });

    return {
      success: true,
      deviceId: updatedDevice.id,
      lastUpdate: updatedDevice.lastUpdate,
    };
  }

  async getLiveBusLocation(companyId: string, busId: string) {
    const bus = await this.prisma.bus.findFirst({
      where: {
        id: busId,
        companyId,
      },
    });

    if (!bus) {
      throw new NotFoundException('Ônibus não encontrado');
    }

    const linkedDevice = await this.prisma.device.findFirst({
      where: {
        companyId,
        busId,
      },
      orderBy: [{ lastUpdate: 'desc' }, { createdAt: 'desc' }],
    });

    if (!linkedDevice) {
      return {
        bus,
        linkedDevice: null,
        state: 'needs-pairing',
        telemetry: null,
      };
    }

    if (!linkedDevice.active) {
      return {
        bus,
        linkedDevice: null,
        state: 'needs-pairing',
        telemetry: null,
      };
    }

    const hasCoordinates =
      linkedDevice.lastLat !== null && linkedDevice.lastLng !== null;

    const isOnline =
      linkedDevice.lastUpdate &&
      Date.now() - new Date(linkedDevice.lastUpdate).getTime() <=
        DEVICE_ONLINE_THRESHOLD_MS &&
      hasCoordinates;

    if (hasCoordinates && linkedDevice.lastUpdate) {
      return {
        bus,
        linkedDevice,
        state: isOnline ? 'live' : 'stale',
        telemetry: {
          latitude: linkedDevice.lastLat,
          longitude: linkedDevice.lastLng,
          lastUpdate: linkedDevice.lastUpdate,
        },
      };
    }

    if (!isOnline) {
      return {
        bus,
        linkedDevice,
        state: 'no-online-device',
        telemetry: null,
      };
    }

    return {
      bus,
      linkedDevice,
      state: 'live',
      telemetry: null,
    };
  }
}
