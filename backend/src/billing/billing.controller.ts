import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { BillingService } from './billing.service';
import { UpdateCompanyBillingSettingsDto } from './dto/update-company-billing-settings.dto';

type AuthenticatedRequest = Request & {
  user: {
    id: string;
    companyId: string | null;
    role: UserRole;
  };
};

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('overview')
  @Roles('ADMIN', 'DRIVER', 'COORDINATOR', 'USER')
  getOverview(@Req() req: AuthenticatedRequest) {
    return this.billingService.getOverview({
      companyId: req.user.companyId,
      userId: req.user.id,
      role: req.user.role,
    });
  }

  @Patch('settings')
  @Roles('ADMIN')
  updateSettings(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateCompanyBillingSettingsDto,
  ) {
    return this.billingService.updateCompanySettings(req.user.companyId, dto);
  }

  @Post('settings/submit-onboarding')
  @Roles('ADMIN')
  submitOnboarding(@Req() req: AuthenticatedRequest) {
    return this.billingService.submitOnboarding(req.user.companyId);
  }
}
