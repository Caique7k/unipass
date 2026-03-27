import { Module } from '@nestjs/common';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { IotDevicesController } from './iot-devices.controller';

@Module({
  controllers: [DevicesController, IotDevicesController],
  providers: [DevicesService, PrismaService],
})
export class DevicesModule {}
