import { Module } from '@nestjs/common';
import { ConfirmationsService } from './confirmations.service';
import { ConfirmationsController } from './confirmations.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ConfirmationsController],
  providers: [ConfirmationsService],
})
export class ConfirmationsModule {}
