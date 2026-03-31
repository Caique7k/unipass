import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CompaniesService } from './companies.service';
import { CheckDomainDto } from './dto/check-domain.dto';
import { SendSmsCodeDto } from './dto/send-sms-code.dto';
import { VerifySmsCodeDto } from './dto/verify-sms-code.dto';
import { CreateCompanyOnboardingDto } from './dto/create-company-onboarding.dto';
import { UpdateCompanyProfileDto } from './dto/update-company-profile.dto';

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
