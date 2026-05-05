import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Public } from '../auth/public.decorator';
import { CompaniesService } from './companies.service';
import { CheckDomainDto } from './dto/check-domain.dto';
import { SendSmsCodeDto } from './dto/send-sms-code.dto';
import { VerifySmsCodeDto } from './dto/verify-sms-code.dto';
import { CreateCompanyOnboardingDto } from './dto/create-company-onboarding.dto';
import { UpdateCompanyProfileDto } from './dto/update-company-profile.dto';
import { RequestCompanyPlanChangeDto } from './dto/request-company-plan-change.dto';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN')
  findAll() {
    return this.companiesService.findAll();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  findMine(@Req() req: any) {
    return this.companiesService.findMine(req.user.companyId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  updateMine(@Req() req: any, @Body() dto: UpdateCompanyProfileDto) {
    return this.companiesService.updateMine(req.user.companyId, dto);
  }

  @Post('me/plan-change-request')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  requestPlanChange(@Req() req: any, @Body() dto: RequestCompanyPlanChangeDto) {
    return this.companiesService.requestPlanChange(
      req.user.companyId,
      req.user,
      dto,
    );
  }

  @Patch(':id/apply-requested-plan')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN')
  applyRequestedPlan(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.companiesService.applyRequestedPlan(id);
  }

  @Public()
  @Throttle({
    default: {
      limit: 20,
      ttl: 60_000,
    },
  })
  @Post('domain-check')
  checkDomain(@Body() dto: CheckDomainDto) {
    return this.companiesService.checkDomainAvailability(dto.domain);
  }

  @Public()
  @Throttle({
    default: {
      limit: 5,
      ttl: 10 * 60_000,
    },
  })
  @Post('onboarding/sms/send')
  sendSmsCode(@Body() dto: SendSmsCodeDto) {
    return this.companiesService.sendSmsCode(dto.phone);
  }

  @Public()
  @Throttle({
    default: {
      limit: 10,
      ttl: 10 * 60_000,
    },
  })
  @Post('onboarding/sms/verify')
  verifySmsCode(@Body() dto: VerifySmsCodeDto) {
    return this.companiesService.verifySmsCode(dto.phone, dto.code);
  }

  @Public()
  @Throttle({
    default: {
      limit: 5,
      ttl: 15 * 60_000,
    },
  })
  @Post('onboarding')
  createOnboarding(@Body() dto: CreateCompanyOnboardingDto) {
    return this.companiesService.createOnboarding(dto);
  }
}
