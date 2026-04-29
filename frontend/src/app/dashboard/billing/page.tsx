"use client";

import type { ComponentProps } from "react";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  Building2,
  CheckCircle2,
  Clock3,
  FileText,
  RefreshCw,
  SendHorizontal,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/app/contexts/AuthContext";
import { PageTableSkeleton } from "@/app/dashboard/components/DashboardSkeletons";
import { AccessDenied } from "@/components/AccessDenied";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { roleLabels, type UserRole } from "@/lib/permissions";
import api from "@/services/api";

type AccessScope = "company" | "self";
type BillingChargeStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "ISSUED"
  | "SENT"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED"
  | "FAILED";
type BillingGatewayMode = "EXTERNAL" | "PLATFORM_GATEWAY";
type BillingOnboardingStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "UNDER_REVIEW"
  | "ACTIVE"
  | "REJECTED"
  | "SUSPENDED";

type BillingOverviewResponse = {
  accessScope: AccessScope;
  permissions: {
    canManageGateway: boolean;
    canViewCompanyOverview: boolean;
    canViewOwnCharges: boolean;
  };
  settings: {
    usePlatformGateway: boolean;
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
    lgpdAcceptedAt: string | null;
    platformTermsAcceptedAt: string | null;
    submittedAt: string | null;
    reviewedAt: string | null;
    reviewNotes: string | null;
    asaasAccountId: string | null;
    createdAt: string;
    updatedAt: string;
  };
  tutorial: Array<{
    id: string;
    title: string;
    description: string;
  }>;
  onboardingChecklist: Array<{
    id: string;
    label: string;
    done: boolean;
  }>;
  summaryCards: Array<{
    id: string;
    label: string;
    value: number;
    helper: string;
  }>;
  charges: Array<{
    id: string;
    description: string;
    amountCents: number;
    dueDate: string;
    status: BillingChargeStatus;
    paidAt: string | null;
    bankSlipUrl: string | null;
    recipientName: string;
    recipientEmail: string | null;
    isOverdue: boolean;
    student: {
      id: string;
      name: string;
      registration: string;
    } | null;
    ownerUser: {
      id: string;
      name: string;
      email: string;
      role: UserRole;
    } | null;
  }>;
};

type BillingSettingsForm = {
  usePlatformGateway: boolean;
  gatewayContactName: string;
  gatewayContactEmail: string;
  gatewayContactPhone: string;
  legalEntityName: string;
  legalDocument: string;
  bankInfoSummary: string;
  defaultAmount: string;
  defaultDueDay: string;
  lgpdAccepted: boolean;
  platformTermsAccepted: boolean;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;

    if (Array.isArray(message)) {
      return message[0] ?? fallback;
    }

    if (typeof message === "string") {
      return message;
    }
  }

  return fallback;
}

function formatCurrency(amountCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amountCents / 100);
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatStatus(status: BillingChargeStatus | BillingOnboardingStatus) {
  const labels: Record<string, string> = {
    DRAFT: "Rascunho",
    SCHEDULED: "Agendado",
    ISSUED: "Emitido",
    SENT: "Enviado",
    PAID: "Pago",
    OVERDUE: "Em atraso",
    CANCELLED: "Cancelado",
    FAILED: "Falhou",
    NOT_STARTED: "Não iniciado",
    IN_PROGRESS: "Em configuração",
    UNDER_REVIEW: "Em análise",
    ACTIVE: "Ativo",
    REJECTED: "Rejeitado",
    SUSPENDED: "Suspenso",
  };

  return labels[status] ?? status;
}

function parseAmountToCents(value: string) {
  const normalized = value.replace(",", ".").trim();

  if (!normalized) {
    return undefined;
  }

  const amount = Number(normalized);

  if (!Number.isFinite(amount) || amount <= 0) {
    return undefined;
  }

  return Math.round(amount * 100);
}

function buildInitialForm(): BillingSettingsForm {
  return {
    usePlatformGateway: false,
    gatewayContactName: "",
    gatewayContactEmail: "",
    gatewayContactPhone: "",
    legalEntityName: "",
    legalDocument: "",
    bankInfoSummary: "",
    defaultAmount: "",
    defaultDueDay: "",
    lgpdAccepted: false,
    platformTermsAccepted: false,
  };
}

export default function BillingPage() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<BillingOverviewResponse | null>(
    null,
  );
  const [form, setForm] = useState<BillingSettingsForm>(buildInitialForm);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isPlatformAdmin = user?.role === "PLATFORM_ADMIN";
  const canAccess = !!user && !isPlatformAdmin;
  const canManageGateway = user?.role === "ADMIN";

  function syncFromOverview(nextOverview: BillingOverviewResponse) {
    setOverview(nextOverview);
    setForm({
      usePlatformGateway: nextOverview.settings.usePlatformGateway,
      gatewayContactName: nextOverview.settings.gatewayContactName ?? "",
      gatewayContactEmail: nextOverview.settings.gatewayContactEmail ?? "",
      gatewayContactPhone: nextOverview.settings.gatewayContactPhone ?? "",
      legalEntityName: nextOverview.settings.legalEntityName ?? "",
      legalDocument: nextOverview.settings.legalDocument ?? "",
      bankInfoSummary: nextOverview.settings.bankInfoSummary ?? "",
      defaultAmount: nextOverview.settings.defaultAmountCents
        ? (nextOverview.settings.defaultAmountCents / 100).toFixed(2)
        : "",
      defaultDueDay: nextOverview.settings.defaultDueDay
        ? String(nextOverview.settings.defaultDueDay)
        : "",
      lgpdAccepted: !!nextOverview.settings.lgpdAcceptedAt,
      platformTermsAccepted: !!nextOverview.settings.platformTermsAcceptedAt,
    });
  }

  const fetchOverview = useCallback(async () => {
    try {
      setLoadError(null);
      const response =
        await api.get<BillingOverviewResponse>("/billing/overview");
      syncFromOverview(response.data);
    } catch (error: unknown) {
      const message = getErrorMessage(
        error,
        "Não foi possível carregar o módulo de boletos.",
      );
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canAccess) {
      setLoading(false);
      return;
    }

    void fetchOverview();
  }, [canAccess, fetchOverview]);

  if (isPlatformAdmin) {
    return (
      <AccessDenied description="O módulo de boletos é voltado para empresas operadoras. O dono da plataforma pode acompanhar isso em uma etapa administrativa futura." />
    );
  }

  if (!canAccess || loading) {
    return <PageTableSkeleton showAction={canManageGateway} compact />;
  }

  if (loadError) {
    return (
      <Card className="max-w-2xl p-6">
        <h1 className="text-2xl font-bold">Boletos</h1>
        <p className="mt-2 text-sm text-muted-foreground">{loadError}</p>
      </Card>
    );
  }

  if (!overview) {
    return <PageTableSkeleton showAction={canManageGateway} compact />;
  }

  async function handleSaveSettings() {
    const parsedAmount = parseAmountToCents(form.defaultAmount);
    const parsedDueDay = form.defaultDueDay.trim()
      ? Number(form.defaultDueDay)
      : null;

    if (form.defaultAmount.trim() && parsedAmount === undefined) {
      toast.error("Informe um valor padrão válido em reais.");
      return;
    }

    if (
      parsedDueDay !== null &&
      (!Number.isInteger(parsedDueDay) || parsedDueDay < 1 || parsedDueDay > 31)
    ) {
      toast.error("Informe um dia de vencimento válido entre 1 e 31.");
      return;
    }

    setSaving(true);

    try {
      await api.patch("/billing/settings", {
        usePlatformGateway: form.usePlatformGateway,
        gatewayContactName: form.gatewayContactName,
        gatewayContactEmail: form.gatewayContactEmail,
        gatewayContactPhone: form.gatewayContactPhone,
        legalEntityName: form.legalEntityName,
        legalDocument: form.legalDocument,
        bankInfoSummary: form.bankInfoSummary,
        defaultAmountCents: form.defaultAmount.trim() ? parsedAmount : null,
        defaultDueDay: parsedDueDay,
        lgpdAccepted: form.lgpdAccepted,
        platformTermsAccepted: form.platformTermsAccepted,
      });

      toast.success("Configuração financeira salva.");
      await fetchOverview();
    } catch (error: unknown) {
      toast.error(
        getErrorMessage(error, "Não foi possível salvar as configurações."),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmitOnboarding() {
    setSubmitting(true);

    try {
      await api.post("/billing/settings/submit-onboarding");
      toast.success("Onboarding financeiro enviado para análise.");
      await fetchOverview();
    } catch (error: unknown) {
      toast.error(
        getErrorMessage(error, "Não foi possível enviar o onboarding."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  const statusTone = overview.settings.usePlatformGateway
    ? "border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/60 dark:bg-emerald-950/20"
    : "border-amber-200 bg-amber-50/80 dark:border-amber-900/60 dark:bg-amber-950/20";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Boletos</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            {overview.accessScope === "company"
              ? "Admin e motorista acompanham a operação financeira da empresa por aqui."
              : "Aluno e coordenador enxergam somente os próprios boletos, sem acesso às cobranças dos demais usuários."}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => void fetchOverview()}
          className="rounded-2xl"
        >
          <RefreshCw className="mr-2 size-4" />
          Atualizar
        </Button>
      </div>

      <Card className={`overflow-hidden border ${statusTone}`}>
        <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Wallet className="size-4 text-[#ff5c00]" />
              <span>
                Modo atual:{" "}
                {overview.settings.usePlatformGateway
                  ? "Gateway da plataforma"
                  : "Gateway externo"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Perfil atual: {roleLabels[user?.role as UserRole]}. Status do
              onboarding: {formatStatus(overview.settings.onboardingStatus)}.
            </p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-background/80 px-4 py-3 text-sm text-muted-foreground">
            Última atualização: {formatDateTime(overview.settings.updatedAt)}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {overview.summaryCards.map((card) => (
          <Card
            key={card.id}
            className="rounded-[24px] border border-border/60"
          >
            <CardContent className="space-y-3 p-5">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <p className="text-3xl font-bold tracking-tight">{card.value}</p>
              <p className="text-sm text-muted-foreground">{card.helper}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.95fr)]">
        <Card className="rounded-[28px] border border-border/60">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-[#fff2ea] text-[#ff5c00] dark:bg-[#2d211a]">
                <Building2 className="size-5" />
              </div>
              <div>
                <CardTitle>Como o gateway funciona</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Este tutorial aparece enquanto o módulo segue opcional ou em
                  configuração.
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {overview.tutorial.map((item) => (
              <div
                key={item.id}
                className="rounded-[22px] border border-border/60 bg-card/60 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-8 items-center justify-center rounded-xl bg-[#ffefe4] text-[#ff5c00] dark:bg-[#2d211a]">
                    <FileText className="size-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border border-border/60">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-[#eef6ff] text-sky-700 dark:bg-[#132533] dark:text-sky-300">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <CardTitle>Checklist do onboarding</CardTitle>
                <p className="text-sm text-muted-foreground">
                  A empresa só avança para análise quando o básico estiver
                  preenchido.
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {overview.onboardingChecklist.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-2xl border border-border/60 px-4 py-3"
              >
                <span className="text-sm">{item.label}</span>
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
                    item.done
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                  }`}
                >
                  {item.done ? (
                    <CheckCircle2 className="size-3.5" />
                  ) : (
                    <Clock3 className="size-3.5" />
                  )}
                  {item.done ? "Concluído" : "Pendente"}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {canManageGateway && (
        <Card className="rounded-[28px] border border-border/60">
          <CardHeader>
            <CardTitle>Configuração da empresa</CardTitle>
            <p className="text-sm text-muted-foreground">
              Somente o administrador consegue definir se a empresa usa gateway
              próprio ou o gateway da plataforma.
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="rounded-[24px] border border-border/60 bg-card/60 p-4">
              <label className="flex items-start gap-3">
                <Checkbox
                  checked={form.usePlatformGateway}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({
                      ...prev,
                      usePlatformGateway: Boolean(checked),
                    }))
                  }
                />
                <div className="space-y-1">
                  <p className="font-medium">
                    Utilizar gateway de pagamento da plataforma
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Se desligado, o módulo continua em modo informativo. Se
                    ligado, a empresa entra no fluxo de onboarding financeiro.
                  </p>
                </div>
              </label>
            </div>

            {form.usePlatformGateway ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Responsável financeiro"
                  value={form.gatewayContactName}
                  onChange={(value) =>
                    setForm((prev) => ({ ...prev, gatewayContactName: value }))
                  }
                  placeholder="Nome de quem cuida dos recebimentos"
                />
                <Field
                  label="E-mail financeiro"
                  value={form.gatewayContactEmail}
                  onChange={(value) =>
                    setForm((prev) => ({ ...prev, gatewayContactEmail: value }))
                  }
                  placeholder="financeiro@empresa.com.br"
                />
                <Field
                  label="Telefone financeiro"
                  value={form.gatewayContactPhone}
                  onChange={(value) =>
                    setForm((prev) => ({ ...prev, gatewayContactPhone: value }))
                  }
                  placeholder="(11) 99999-0000"
                />
                <Field
                  label="Razão social"
                  value={form.legalEntityName}
                  onChange={(value) =>
                    setForm((prev) => ({ ...prev, legalEntityName: value }))
                  }
                  placeholder="Nome jurídico da empresa"
                />
                <Field
                  label="Documento da empresa"
                  value={form.legalDocument}
                  onChange={(value) =>
                    setForm((prev) => ({ ...prev, legalDocument: value }))
                  }
                  placeholder="CNPJ ou documento de faturamento"
                />
                <Field
                  label="Valor padrão (R$)"
                  value={form.defaultAmount}
                  onChange={(value) =>
                    setForm((prev) => ({ ...prev, defaultAmount: value }))
                  }
                  placeholder="199.90"
                  type="number"
                  step="0.01"
                />
                <Field
                  label="Dia padrão de vencimento"
                  value={form.defaultDueDay}
                  onChange={(value) =>
                    setForm((prev) => ({ ...prev, defaultDueDay: value }))
                  }
                  placeholder="10"
                  type="number"
                  min="1"
                  max="31"
                />

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">
                    Resumo das informações bancárias
                  </label>
                  <Textarea
                    value={form.bankInfoSummary}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        bankInfoSummary: event.target.value,
                      }))
                    }
                    placeholder="Banco, titularidade, regras de repasse, observações e o que já foi validado com a empresa."
                  />
                </div>

                <label className="flex items-start gap-3 rounded-2xl border border-border/60 p-4">
                  <Checkbox
                    checked={form.lgpdAccepted}
                    onCheckedChange={(checked) =>
                      setForm((prev) => ({
                        ...prev,
                        lgpdAccepted: Boolean(checked),
                      }))
                    }
                  />
                  <div className="space-y-1">
                    <p className="font-medium">Aceite de proteção de dados</p>
                    <p className="text-sm text-muted-foreground">
                      Confirma que a empresa entende o tratamento de dados dos
                      pagadores e dos alunos envolvidos na cobrança.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 rounded-2xl border border-border/60 p-4">
                  <Checkbox
                    checked={form.platformTermsAccepted}
                    onCheckedChange={(checked) =>
                      setForm((prev) => ({
                        ...prev,
                        platformTermsAccepted: Boolean(checked),
                      }))
                    }
                  />
                  <div className="space-y-1">
                    <p className="font-medium">
                      Aceite dos termos operacionais
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Confirma repasse, responsabilidade sobre cobrança,
                      conciliação e uso do gateway da plataforma.
                    </p>
                  </div>
                </label>
              </div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-border/70 bg-muted/20 p-5 text-sm text-muted-foreground">
                Enquanto o gateway da plataforma estiver desligado, o módulo
                continua exibindo o tutorial e não libera a operação financeira
                centralizada.
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                onClick={() => void handleSaveSettings()}
                disabled={saving}
                className="rounded-2xl bg-[#ff5c00] text-white hover:bg-[#e65300]"
              >
                {saving ? "Salvando..." : "Salvar configuração"}
              </Button>

              {form.usePlatformGateway && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleSubmitOnboarding()}
                  disabled={submitting}
                  className="rounded-2xl"
                >
                  <SendHorizontal className="mr-2 size-4" />
                  {submitting
                    ? "Enviando..."
                    : "Enviar onboarding para análise"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-[28px] border border-border/60">
        <CardHeader>
          <CardTitle>
            {overview.accessScope === "company"
              ? "Boletos e inadimplência"
              : "Meus boletos"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {overview.accessScope === "company"
              ? "Admin e motorista conseguem acompanhar a visão consolidada da empresa."
              : "Esta lista fica restrita ao próprio usuário logado."}
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {overview.charges.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-border/70 bg-muted/20 p-6 text-sm text-muted-foreground">
              Ainda não existem boletos cadastrados para esta visão. O próximo
              passo natural é ligar a geração de cobranças a uma regra mensal
              por empresa.
            </div>
          ) : (
            <div className="overflow-hidden rounded-[24px] border border-border/60">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    {overview.accessScope === "company" && (
                      <TableHead>Responsável</TableHead>
                    )}
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pagamento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overview.charges.map((charge) => (
                    <TableRow key={charge.id}>
                      <TableCell className="align-top">
                        <div className="space-y-1">
                          <p className="font-medium">{charge.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {charge.recipientName}
                            {charge.student ? ` • ${charge.student.name}` : ""}
                          </p>
                        </div>
                      </TableCell>
                      {overview.accessScope === "company" && (
                        <TableCell className="align-top">
                          <div className="space-y-1">
                            <p className="font-medium">
                              {charge.ownerUser?.name ??
                                "Sem usuário vinculado"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {charge.ownerUser
                                ? roleLabels[charge.ownerUser.role]
                                : "Externo"}
                            </p>
                          </div>
                        </TableCell>
                      )}
                      <TableCell>
                        {formatCurrency(charge.amountCents)}
                      </TableCell>
                      <TableCell>{formatDate(charge.dueDate)}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                            charge.isOverdue
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                              : charge.status === "PAID"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                          }`}
                        >
                          {charge.isOverdue
                            ? "Em atraso"
                            : formatStatus(charge.status)}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(charge.paidAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  step,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: ComponentProps<typeof Input>["type"];
  step?: string;
  min?: string;
  max?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <Input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        step={step}
        min={min}
        max={max}
      />
    </div>
  );
}
