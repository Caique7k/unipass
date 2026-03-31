import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CompaniesService } from './companies.service';
import { CheckDomainDto } from './dto/check-domain.dto';
import { SendSmsCodeDto } from './dto/send-sms-code.dto';
import { VerifySmsCodeDto } from './dto/verify-sms-code.dto';
import { CreateCompanyOnboardingDto } from './dto/create-company-onboarding.dto';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN')
  findAll() {
    return this.companiesService.findAll();
  }

  @Post('domain-check')
  checkDomain(@Body() dto: CheckDomainDto) {
    return this.companiesService.checkDomainAvailability(dto.domain);
  }

  @Post('onboarding/sms/send')
  sendSmsCode(@Body() dto: SendSmsCodeDto) {
    return this.companiesService.sendSmsCode(dto.phone);
  }

  @Post('onboarding/sms/verify')
  verifySmsCode(@Body() dto: VerifySmsCodeDto) {
    return this.companiesService.verifySmsCode(dto.phone, dto.code);
  }

  @Post('onboarding')
  createOnboarding(@Body() dto: CreateCompanyOnboardingDto) {
    return this.companiesService.createOnboarding(dto);
  }
}
