import { Module } from '@nestjs/common';
import { RouteSchedulesService } from './route-schedules.service';
import { RouteSchedulesController } from './route-schedules.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RouteSchedulesController],
  providers: [RouteSchedulesService],
  exports: [RouteSchedulesService],
})
export class RouteSchedulesModule {}
