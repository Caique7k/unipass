import { Module } from '@nestjs/common';
import { RfidService } from './rfid.service';
import { RfidController } from './rfid.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [RfidController],
  providers: [RfidService, PrismaService],
})
export class RfidModule {}
