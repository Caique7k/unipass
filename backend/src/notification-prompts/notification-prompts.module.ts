import { Module } from '@nestjs/common';
import { NotificationPromptsController } from './notification-prompts.controller';
import { NotificationPromptsService } from './notification-prompts.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationPromptsController],
  providers: [NotificationPromptsService],
  exports: [NotificationPromptsService],
})
export class NotificationPromptsModule {}
