import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BusesService } from './buses.service';
import { BusesController } from './buses.controller';

@Module({
  imports: [PrismaModule],
  providers: [BusesService],
  controllers: [BusesController],
})
export class BusesModule {}
