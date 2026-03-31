import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CompanyPlan, UserRole } from '@prisma/client';
import { CreateCompanyOnboardingDto } from './dto/create-company-onboarding.dto';
import { UpdateCompanyProfileDto } from './dto/update-company-profile.dto';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';

type SmsChallenge = {
  code: string;
  expiresAt: Date;
  verifiedAt?: Date;
};

@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);
  private readonly smsChallenges = new Map<string, SmsChallenge>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async findAll() {
    return this.prisma.company.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            users: true,
            students: true,
            buses: true,
            devices: true,
          },
        },
      },
    });
  }

  async findMine(companyId?: string | null) {
    const company = await this.getCompanyOrFail(companyId);

    const counts = await this.prisma.company.findUnique({
      where: { id: company.id },
      include: {
        _count: {
          select: {
            users: true,
            students: true,
            buses: true,
            devices: true,
          },
        },
      },
    });

    return {
      id: company.id,
      name: company.name,
      cnpj: company.cnpj,
      emailDomain: company.emailDomain,
      plan: company.plan,
      contactName: company.contactName,
      contactPhone: company.contactPhone,
      smsVerifiedAt: company.smsVerifiedAt,
      createdAt: company.createdAt,
      _count: counts?._count ?? {
        users: 0,
        students: 0,
        buses: 0,
        devices: 0,
      },
    };
  }

  async updateMine(companyId: string | null | undefined, dto: UpdateCompanyProfileDto) {
    const company = await this.getCompanyOrFail(companyId);
    const normalizedCnpj = this.normalizeCnpj(dto.cnpj);
    const normalizedPhone = dto.contactPhone
      ? this.normalizePhone(dto.contactPhone)
      : null;

    const existingCompanyByCnpj = await this.prisma.company.findUnique({
      where: { cnpj: normalizedCnpj },
      select: { id: true },
    });

    if (existingCompanyByCnpj && existingCompanyByCnpj.id !== company.id) {
      throw new BadRequestException('Ja existe uma empresa cadastrada com este CNPJ.');
    }

    return this.prisma.company.update({
      where: { id: company.id },
      data: {
        name: dto.name.trim(),
        cnpj: normalizedCnpj,
        contactName: dto.contactName?.trim() || null,
        contactPhone: normalizedPhone,
      },
      select: {
        id: true,
        name: true,
        cnpj: true,
        emailDomain: true,
        plan: true,
        contactName: true,
        contactPhone: true,
        smsVerifiedAt: true,
        createdAt: true,
      },
    });
  }

  async checkDomainAvailability(rawDomain: string) {
    const normalizedDomain = this.normalizeDomain(rawDomain);
    const existingCompany = await this.prisma.company.findUnique({
      where: { emailDomain: normalizedDomain },
      select: { id: true, name: true },
    });

    if (!existingCompany) {
      return {
        available: true,
        normalizedDomain,
        suggestions: [] as string[],
      };
    }

    return {
      available: false,
      normalizedDomain,
      suggestions: await this.buildDomainSuggestions(normalizedDomain),
      message: `O dominio ${normalizedDomain} ja esta em uso.`,
    };
  }

  async sendSmsCode(phone: string) {
    const normalizedPhone = this.normalizePhone(phone);
    const code = `${randomInt(100000, 999999)}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const provider = this.getSmsProvider();

    this.smsChallenges.set(normalizedPhone, {
      code,
      expiresAt,
    });

    if (provider === 'twilio') {
      await this.sendViaTwilio(normalizedPhone, code);
    }

    return {
      success: true,
      phone: normalizedPhone,
      expiresAt,
      delivery: provider === 'twilio' ? 'provider' : 'simulated',
      ...(provider === 'twilio' ? {} : { developmentCode: code }),
    };
  }

  verifySmsCode(phone: string, code: string) {
    const normalizedPhone = this.normalizePhone(phone);
    const challenge = this.smsChallenges.get(normalizedPhone);

    if (!challenge || challenge.expiresAt.getTime() < Date.now()) {
      this.smsChallenges.delete(normalizedPhone);
      throw new BadRequestException('O codigo expirou. Solicite um novo SMS.');
    }

    if (challenge.code !== code.trim()) {
      throw new BadRequestException('Codigo invalido.');
    }

    challenge.verifiedAt = new Date();
    this.smsChallenges.set(normalizedPhone, challenge);

    return {
      success: true,
      phone: normalizedPhone,
      verifiedAt: challenge.verifiedAt,
    };
  }

  async createOnboarding(dto: CreateCompanyOnboardingDto) {
    const normalizedPhone = this.normalizePhone(dto.phone);
    const normalizedDomain = this.normalizeDomain(dto.domain);
    const challenge = this.smsChallenges.get(normalizedPhone);

    if (!challenge?.verifiedAt) {
      throw new BadRequestException(
        'Verifique o telefone por SMS antes de concluir o cadastro.',
      );
    }

    await this.ensureCompanyAvailability(dto.cnpj, normalizedDomain);

    const normalizedAdminEmail = this.composeCompanyEmail(
      dto.adminLogin,
      normalizedDomain,
    );
    await this.ensureAdminEmailAvailability(normalizedAdminEmail);

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const company = await this.prisma.$transaction(async (tx) => {
      const createdCompany = await tx.company.create({
        data: {
          name: dto.companyName.trim(),
          cnpj: this.normalizeCnpj(dto.cnpj),
          emailDomain: normalizedDomain,
          plan: dto.plan as CompanyPlan,
          contactName: dto.contactName.trim(),
          contactPhone: normalizedPhone,
          smsVerifiedAt: challenge.verifiedAt,
        },
      });

      await tx.user.create({
        data: {
          companyId: createdCompany.id,
          name: dto.adminName.trim(),
          email: normalizedAdminEmail,
          password: hashedPassword,
          role: UserRole.ADMIN,
          active: true,
        },
      });

      return createdCompany;
    });

    this.smsChallenges.delete(normalizedPhone);

    return {
      success: true,
      companyId: company.id,
      loginEmail: normalizedAdminEmail,
      plan: company.plan,
    };
  }

  private async ensureCompanyAvailability(cnpj: string, domain: string) {
    const [existingCompanyByCnpj, existingCompanyByDomain] = await Promise.all([
      this.prisma.company.findUnique({
        where: { cnpj: this.normalizeCnpj(cnpj) },
        select: { id: true },
      }),
      this.prisma.company.findUnique({
        where: { emailDomain: domain },
        select: { id: true },
      }),
    ]);

    if (existingCompanyByCnpj) {
      throw new BadRequestException('Ja existe uma empresa cadastrada com este CNPJ.');
    }

    if (existingCompanyByDomain) {
      throw new BadRequestException('Este dominio ja esta em uso por outra empresa.');
    }
  }

  private async ensureAdminEmailAvailability(email: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new BadRequestException('Ja existe um usuario com este email.');
    }
  }

  private async getCompanyOrFail(companyId?: string | null) {
    if (!companyId) {
      throw new BadRequestException('Usuario sem empresa vinculada.');
    }

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new BadRequestException('Empresa nao encontrada.');
    }

    return company;
  }

  private normalizeDomain(domain: string) {
    const sanitized = domain
      .trim()
      .toLowerCase()
      .replace(/^@+/, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9.-]/g, '');

    if (!/^[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9-]+)+$/.test(sanitized)) {
      throw new BadRequestException('Informe um dominio valido, como empresa.com.br.');
    }

    return sanitized;
  }

  private composeCompanyEmail(login: string, domain: string) {
    const normalizedLogin = login
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9._-]/g, '');

    if (!/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/.test(normalizedLogin)) {
      throw new BadRequestException(
        'Use apenas letras, numeros, ponto, underline ou hifen no login.',
      );
    }

    return `${normalizedLogin}@${domain}`;
  }

  private normalizePhone(phone: string) {
    const digits = phone.replace(/\D/g, '');

    if (digits.length < 10 || digits.length > 13) {
      throw new BadRequestException('Informe um telefone celular valido.');
    }

    return digits.startsWith('55') ? `+${digits}` : `+55${digits}`;
  }

  private normalizeCnpj(cnpj: string) {
    const digits = cnpj.replace(/\D/g, '');

    if (digits.length !== 14) {
      throw new BadRequestException('Informe um CNPJ valido com 14 digitos.');
    }

    return digits;
  }

  private async buildDomainSuggestions(domain: string) {
    const [root, ...rest] = domain.split('.');
    const suffix = rest.length > 0 ? `.${rest.join('.')}` : '.com.br';
    const base = root.replace(/-+/g, '-');
    const variants = [
      `${base}oficial${suffix}`,
      `${base}transportes${suffix}`,
      `${base}mobility${suffix}`,
      `${base}app${suffix}`,
      `${base}01${suffix}`,
      `${base}-grupo${suffix}`,
    ];

    const uniqueVariants = [...new Set(variants)].filter(
      (candidate) => candidate !== domain,
    );

    const companies = await this.prisma.company.findMany({
      where: {
        emailDomain: {
          in: uniqueVariants,
        },
      },
      select: {
        emailDomain: true,
      },
    });

    const used = new Set(companies.map((company) => company.emailDomain));

    return uniqueVariants.filter((candidate) => !used.has(candidate)).slice(0, 4);
  }

  private getSmsProvider() {
    const provider = this.configService
      .get<string>('SMS_PROVIDER')
      ?.trim()
      .toLowerCase();

    if (!provider || provider === 'dev' || provider === 'mock') {
      return 'mock';
    }

    if (provider === 'twilio') {
      return 'twilio';
    }

    throw new ServiceUnavailableException(
      'O provedor de SMS configurado nao e suportado.',
    );
  }

  private async sendViaTwilio(phone: string, code: string) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    const messagingServiceSid = this.configService.get<string>(
      'TWILIO_MESSAGING_SERVICE_SID',
    );
    const from = this.configService.get<string>('TWILIO_FROM_NUMBER');

    if (!accountSid || !authToken || (!messagingServiceSid && !from)) {
      this.logger.error(
        'Configuracao Twilio incompleta. Defina TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN e TWILIO_MESSAGING_SERVICE_SID ou TWILIO_FROM_NUMBER.',
      );
      throw new ServiceUnavailableException(
        'O envio de SMS nao esta configurado no servidor.',
      );
    }

    const payload = new URLSearchParams({
      To: phone,
      Body: `Seu codigo de verificacao UniPass e ${code}. Ele expira em 10 minutos.`,
    });

    if (messagingServiceSid) {
      payload.set('MessagingServiceSid', messagingServiceSid);
    } else if (from) {
      payload.set('From', from);
    }

    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString(
      'base64',
    );

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: payload.toString(),
      },
    );

    if (!response.ok) {
      const responseText = await response.text();

      this.logger.error(
        `Falha ao enviar SMS pela Twilio para ${phone}: ${response.status} ${responseText}`,
      );

      throw new ServiceUnavailableException(
        'Nao foi possivel enviar o SMS de verificacao agora.',
      );
    }
  }
}
