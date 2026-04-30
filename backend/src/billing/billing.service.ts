import { BadRequestException, Injectable } from '@nestjs/common';
import {
  BillingChargeStatus,
  BillingGatewayMode,
  BillingOnboardingStatus,
  Prisma,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCompanyBillingSettingsDto } from './dto/update-company-billing-settings.dto';

type BillingAccessScope = 'company' | 'self';

const CLOSED_CHARGE_STATUSES: BillingChargeStatus[] = [
  BillingChargeStatus.PAID,
  BillingChargeStatus.CANCELLED,
];

const OVERDUE_IGNORED_STATUSES: BillingChargeStatus[] = [
  BillingChargeStatus.PAID,
  BillingChargeStatus.CANCELLED,
  BillingChargeStatus.FAILED,
];

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(params: {
    companyId?: string | null;
    userId: string;
    role: UserRole;
  }) {
    const companyId = this.requireCompanyId(params.companyId);
    const settings = await this.ensureCompanySettings(companyId);
    const scope = this.getAccessScope(params.role);
    const chargesWhere: Prisma.BillingChargeWhereInput =
      scope === 'company'
        ? { companyId }
        : {
            companyId,
            ownerUserId: params.userId,
          };
    const now = new Date();

    const [totalCharges, paidCharges, openCharges, overdueCharges, charges] =
      await Promise.all([
        this.prisma.billingCharge.count({
          where: chargesWhere,
        }),
        this.prisma.billingCharge.count({
          where: {
            AND: [chargesWhere, { status: BillingChargeStatus.PAID }],
          },
        }),
        this.prisma.billingCharge.count({
          where: {
            AND: [
              chargesWhere,
              {
                status: {
                  notIn: [...CLOSED_CHARGE_STATUSES],
                },
              },
            ],
          },
        }),
        this.prisma.billingCharge.count({
          where: {
            AND: [
              chargesWhere,
              {
                dueDate: {
                  lt: now,
                },
              },
              {
                status: {
                  notIn: [...OVERDUE_IGNORED_STATUSES],
                },
              },
            ],
          },
        }),
        this.prisma.billingCharge.findMany({
          where: chargesWhere,
          include: {
            ownerUser: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
            student: {
              select: {
                id: true,
                name: true,
                registration: true,
              },
            },
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                document: true,
                asaasCustomerId: true,
              },
            },
          },
          orderBy: [{ dueDate: 'desc' }, { createdAt: 'desc' }],
          take: 20,
        }),
      ]);

    return {
      accessScope: scope,
      permissions: {
        canManageGateway: params.role === UserRole.ADMIN,
        canViewCompanyOverview: scope === 'company',
        canViewOwnCharges: true,
      },
      settings: this.mapSettings(settings),
      tutorial: this.getTutorialContent(),
      onboardingChecklist: this.getOnboardingChecklist(settings),
      summaryCards: this.buildSummaryCards({
        scope,
        totalCharges,
        paidCharges,
        openCharges,
        overdueCharges,
      }),
      charges: charges.map((charge) => ({
        id: charge.id,
        description: charge.description,
        amountCents: charge.amountCents,
        dueDate: charge.dueDate,
        status: charge.status,
        gatewayStatus: charge.gatewayStatus,
        paidAt: charge.paidAt,
        bankSlipUrl: charge.bankSlipUrl ?? charge.gatewayInvoiceUrl,
        gatewayInvoiceUrl: charge.gatewayInvoiceUrl,
        externalReference: charge.externalReference,
        recipientName: charge.recipientName,
        recipientEmail: charge.recipientEmail,
        isOverdue:
          charge.dueDate.getTime() < now.getTime() &&
          !OVERDUE_IGNORED_STATUSES.includes(charge.status),
        student: charge.student,
        customer: charge.customer,
        ownerUser: charge.ownerUser
          ? {
              id: charge.ownerUser.id,
              name: charge.ownerUser.name,
              email: charge.ownerUser.email,
              role: charge.ownerUser.role,
            }
          : null,
      })),
    };
  }

  async updateCompanySettings(
    companyId: string | null | undefined,
    dto: UpdateCompanyBillingSettingsDto,
  ) {
    const normalizedCompanyId = this.requireCompanyId(companyId);
    const currentSettings =
      await this.ensureCompanySettings(normalizedCompanyId);
    const now = new Date();
    const nextGatewayMode =
      dto.usePlatformGateway === undefined
        ? undefined
        : dto.usePlatformGateway
          ? BillingGatewayMode.PLATFORM_GATEWAY
          : BillingGatewayMode.EXTERNAL;
    const nextOnboardingStatus =
      dto.usePlatformGateway === undefined
        ? undefined
        : this.resolveOnboardingStatusChange(
            currentSettings.onboardingStatus,
            dto.usePlatformGateway,
          );

    const updated = await this.prisma.companyBillingSettings.update({
      where: {
        companyId: normalizedCompanyId,
      },
      data: {
        gatewayMode: nextGatewayMode,
        onboardingStatus: nextOnboardingStatus,
        gatewayContactName: this.normalizeOptionalString(
          dto.gatewayContactName,
        ),
        gatewayContactEmail: this.normalizeOptionalString(
          dto.gatewayContactEmail,
        ),
        gatewayContactPhone: this.normalizeOptionalString(
          dto.gatewayContactPhone,
        ),
        legalEntityName: this.normalizeOptionalString(dto.legalEntityName),
        legalDocument: this.normalizeOptionalString(dto.legalDocument),
        bankInfoSummary: this.normalizeOptionalString(dto.bankInfoSummary),
        defaultAmountCents: dto.defaultAmountCents,
        defaultDueDay: dto.defaultDueDay,
        lgpdAcceptedAt:
          dto.lgpdAccepted === undefined
            ? undefined
            : dto.lgpdAccepted
              ? (currentSettings.lgpdAcceptedAt ?? now)
              : null,
        platformTermsAcceptedAt:
          dto.platformTermsAccepted === undefined
            ? undefined
            : dto.platformTermsAccepted
              ? (currentSettings.platformTermsAcceptedAt ?? now)
              : null,
      },
    });

    return this.mapSettings(updated);
  }

  async submitOnboarding(companyId: string | null | undefined) {
    const normalizedCompanyId = this.requireCompanyId(companyId);
    const settings = await this.ensureCompanySettings(normalizedCompanyId);

    if (settings.gatewayMode !== BillingGatewayMode.PLATFORM_GATEWAY) {
      throw new BadRequestException(
        'Ative o gateway da plataforma antes de enviar o onboarding.',
      );
    }

    const missingFields = [
      !settings.gatewayContactName && 'responsável financeiro',
      !settings.gatewayContactEmail && 'e-mail financeiro',
      !settings.legalEntityName && 'razão social',
      !settings.legalDocument && 'documento da empresa',
      !settings.bankInfoSummary && 'resumo das informações bancárias',
      !settings.lgpdAcceptedAt && 'aceite de proteção de dados',
      !settings.platformTermsAcceptedAt && 'aceite dos termos da plataforma',
    ].filter(Boolean);

    if (missingFields.length > 0) {
      throw new BadRequestException(
        `Complete os seguintes campos antes de enviar: ${missingFields.join(', ')}.`,
      );
    }

    const updated = await this.prisma.companyBillingSettings.update({
      where: {
        companyId: normalizedCompanyId,
      },
      data: {
        onboardingStatus: BillingOnboardingStatus.UNDER_REVIEW,
        submittedAt: new Date(),
      },
    });

    return this.mapSettings(updated);
  }

  private async ensureCompanySettings(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: {
        id: companyId,
      },
      select: {
        id: true,
      },
    });

    if (!company) {
      throw new BadRequestException(
        'Empresa não encontrada para o módulo financeiro.',
      );
    }

    return this.prisma.companyBillingSettings.upsert({
      where: {
        companyId,
      },
      update: {},
      create: {
        companyId,
      },
    });
  }

  private requireCompanyId(companyId?: string | null) {
    if (!companyId) {
      throw new BadRequestException(
        'Este usuário não está vinculado a uma empresa.',
      );
    }

    return companyId;
  }

  private getAccessScope(role: UserRole): BillingAccessScope {
    if (role === UserRole.ADMIN) {
      return 'company';
    }

    return 'self';
  }

  private resolveOnboardingStatusChange(
    currentStatus: BillingOnboardingStatus,
    usePlatformGateway: boolean,
  ) {
    if (!usePlatformGateway) {
      if (
        currentStatus === BillingOnboardingStatus.ACTIVE ||
        currentStatus === BillingOnboardingStatus.UNDER_REVIEW
      ) {
        return BillingOnboardingStatus.SUSPENDED;
      }

      return BillingOnboardingStatus.NOT_STARTED;
    }

    if (
      currentStatus === BillingOnboardingStatus.ACTIVE ||
      currentStatus === BillingOnboardingStatus.UNDER_REVIEW
    ) {
      return currentStatus;
    }

    return BillingOnboardingStatus.IN_PROGRESS;
  }

  private normalizeOptionalString(value?: string) {
    if (value === undefined) {
      return undefined;
    }

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  private mapSettings(settings: {
    gatewayMode: BillingGatewayMode;
    onboardingStatus: BillingOnboardingStatus;
    gatewayContactName: string | null;
    gatewayContactEmail: string | null;
    gatewayContactPhone: string | null;
    legalEntityName: string | null;
    legalDocument: string | null;
    bankInfoSummary: string | null;
    defaultAmountCents: number | null;
    defaultDueDay: number | null;
    lgpdAcceptedAt: Date | null;
    platformTermsAcceptedAt: Date | null;
    submittedAt: Date | null;
    reviewedAt: Date | null;
    reviewNotes: string | null;
    asaasAccountId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      usePlatformGateway:
        settings.gatewayMode === BillingGatewayMode.PLATFORM_GATEWAY,
      gatewayMode: settings.gatewayMode,
      onboardingStatus: settings.onboardingStatus,
      gatewayContactName: settings.gatewayContactName,
      gatewayContactEmail: settings.gatewayContactEmail,
      gatewayContactPhone: settings.gatewayContactPhone,
      legalEntityName: settings.legalEntityName,
      legalDocument: settings.legalDocument,
      bankInfoSummary: settings.bankInfoSummary,
      defaultAmountCents: settings.defaultAmountCents,
      defaultDueDay: settings.defaultDueDay,
      lgpdAcceptedAt: settings.lgpdAcceptedAt,
      platformTermsAcceptedAt: settings.platformTermsAcceptedAt,
      submittedAt: settings.submittedAt,
      reviewedAt: settings.reviewedAt,
      reviewNotes: settings.reviewNotes,
      asaasAccountId: settings.asaasAccountId,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    };
  }

  private buildSummaryCards(params: {
    scope: BillingAccessScope;
    totalCharges: number;
    paidCharges: number;
    openCharges: number;
    overdueCharges: number;
  }) {
    const totalLabel =
      params.scope === 'company' ? 'Boletos emitidos' : 'Meus boletos';
    const overdueLabel =
      params.scope === 'company' ? 'Inadimplentes' : 'Em atraso';
    const openLabel = params.scope === 'company' ? 'Em aberto' : 'Pendentes';

    return [
      {
        id: 'total',
        label: totalLabel,
        value: params.totalCharges,
        helper:
          params.scope === 'company'
            ? 'Visão consolidada da empresa.'
            : 'Cobranças vinculadas ao seu usuário.',
      },
      {
        id: 'paid',
        label: 'Pagos',
        value: params.paidCharges,
        helper: 'Já conciliados no histórico.',
      },
      {
        id: 'overdue',
        label: overdueLabel,
        value: params.overdueCharges,
        helper: 'Boletos vencidos e ainda não pagos.',
      },
      {
        id: 'open',
        label: openLabel,
        value: params.openCharges,
        helper: 'Cobranças aguardando pagamento.',
      },
    ];
  }

  private getOnboardingChecklist(settings: {
    gatewayMode: BillingGatewayMode;
    gatewayContactName: string | null;
    gatewayContactEmail: string | null;
    legalEntityName: string | null;
    legalDocument: string | null;
    bankInfoSummary: string | null;
    lgpdAcceptedAt: Date | null;
    platformTermsAcceptedAt: Date | null;
  }) {
    return [
      {
        id: 'gateway',
        label: 'Gateway da plataforma ativado',
        done: settings.gatewayMode === BillingGatewayMode.PLATFORM_GATEWAY,
      },
      {
        id: 'contact',
        label: 'Contato financeiro cadastrado',
        done: !!settings.gatewayContactName && !!settings.gatewayContactEmail,
      },
      {
        id: 'legal',
        label: 'Razão social e documento preenchidos',
        done: !!settings.legalEntityName && !!settings.legalDocument,
      },
      {
        id: 'bank',
        label: 'Informações bancárias resumidas',
        done: !!settings.bankInfoSummary,
      },
      {
        id: 'lgpd',
        label: 'Aceite de proteção de dados',
        done: !!settings.lgpdAcceptedAt,
      },
      {
        id: 'terms',
        label: 'Aceite dos termos operacionais',
        done: !!settings.platformTermsAcceptedAt,
      },
    ];
  }

  private getTutorialContent() {
    return [
      {
        id: 'optional-module',
        title: 'Módulo opcional por empresa',
        description:
          'O UniPass não obriga a empresa a usar o gateway da plataforma. Quem já possui operação própria pode continuar externo sem perder o restante do sistema.',
      },
      {
        id: 'financial-data',
        title: 'Dados financeiros e bancários',
        description:
          'Ao ativar o gateway da plataforma, a empresa precisa informar responsável financeiro, documento da empresa e dados bancários para repasse e validação operacional.',
      },
      {
        id: 'privacy',
        title: 'Proteção de dados e rastreabilidade',
        description:
          'Toda cobrança precisa ter trilha de auditoria, aceite de dados e uma política clara de quem pode ver inadimplência. No UniPass, apenas administradores veem a visão consolidada da empresa; os demais perfis ficam restritos às cobranças próprias.',
      },
      {
        id: 'automation',
        title: 'Automação de emissão e notificação',
        description:
          'Depois da ativação, a empresa poderá definir valor, vencimento padrão e acompanhar futuras automações de geração, envio e conciliação dos boletos.',
      },
    ];
  }
}
