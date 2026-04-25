"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  ArrowRightLeft,
  BadgeCheck,
  BookUserIcon,
  Building2,
  Bus,
  CheckCircle2,
  Clock3,
  Cpu,
  FileText,
  Phone,
  Save,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/app/contexts/AuthContext";
import { AccessDenied } from "@/components/AccessDenied";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  CompanyPlan,
  companyPlanMeta,
  companyPlanOrder,
} from "@/lib/company-plans";
import { cn } from "@/lib/utils";
import api from "@/services/api";

type PendingPlanChangeRequest = {
  currentPlan: CompanyPlan;
  requestedPlan: CompanyPlan;
  requestedAt: string;
  requestedByName: string | null;
  requestedByEmail: string | null;
};

type CompanyProfile = {
  id: string;
  name: string;
  cnpj: string;
  emailDomain: string;
  plan: CompanyPlan;
  contactName: string | null;
  contactPhone: string | null;
  smsVerifiedAt: string | null;
  createdAt: string;
  pendingPlanChangeRequest: PendingPlanChangeRequest | null;
  _count: {
    users: number;
    students: number;
    buses: number;
    devices: number;
  };
};

type FormErrors = Partial<
  Record<"name" | "cnpj" | "contactName" | "contactPhone", string>
>;

type PlanChangeResponse = {
  message: string;
  company: CompanyProfile;
};

const planTheme: Record<
  CompanyPlan,
  {
    surface: string;
    accentBar: string;
    tag: string;
    dot: string;
  }
> = {
  ESSENTIAL: {
    surface:
      "bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(148,163,184,0.05)_100%)]",
    accentBar: "from-slate-500 to-slate-700 dark:from-slate-300 dark:to-slate-500",
    tag: "bg-slate-900 text-white dark:bg-slate-200 dark:text-slate-900",
    dot: "bg-slate-500 dark:bg-slate-300",
  },
  GROWTH: {
    surface:
      "bg-[linear-gradient(180deg,#fff7f1_0%,#ffffff_100%)] dark:bg-[linear-gradient(180deg,rgba(255,92,0,0.12)_0%,rgba(255,255,255,0.03)_100%)]",
    accentBar: "from-[#ff8b52] to-[#ff5c00]",
    tag: "bg-[#ff5c00] text-white",
    dot: "bg-[#ff5c00]",
  },
  SCALE: {
    surface:
      "bg-[linear-gradient(180deg,#f2fff8_0%,#ffffff_100%)] dark:bg-[linear-gradient(180deg,rgba(16,185,129,0.14)_0%,rgba(255,255,255,0.03)_100%)]",
    accentBar: "from-emerald-400 to-emerald-600",
    tag: "bg-emerald-600 text-white",
    dot: "bg-emerald-500",
  },
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

function formatCnpj(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 14);

  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").replace(/^55/, "").slice(0, 11);

  if (!digits) return "";
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatDate(value?: string | null) {
  if (!value) {
    return "Ainda não disponível";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "Ainda não disponível";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function CompanyPage() {
  const { user } = useAuth();
  const canManage = user?.role === "ADMIN";
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPlanChange, setSavingPlanChange] = useState(false);
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<CompanyPlan>("ESSENTIAL");
  const [errors, setErrors] = useState<FormErrors>({});
  const [form, setForm] = useState({
    name: "",
    cnpj: "",
    contactName: "",
    contactPhone: "",
  });

  function syncProfile(nextProfile: CompanyProfile) {
    setProfile(nextProfile);
    setForm({
      name: nextProfile.name,
      cnpj: formatCnpj(nextProfile.cnpj),
      contactName: nextProfile.contactName ?? "",
      contactPhone: formatPhone(nextProfile.contactPhone ?? ""),
    });
    setSelectedPlan(
      nextProfile.pendingPlanChangeRequest?.requestedPlan ?? nextProfile.plan,
    );
  }

  useEffect(() => {
    if (!canManage) {
      setLoading(false);
      return;
    }

    async function fetchCompany() {
      try {
        const response = await api.get<CompanyProfile>("/companies/me");
        syncProfile(response.data);
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, "Não foi possível carregar a empresa."));
      } finally {
        setLoading(false);
      }
    }

    void fetchCompany();
  }, [canManage]);

  if (!canManage) {
    return (
      <AccessDenied description="Somente o administrador da empresa pode editar os dados institucionais e solicitar mudanças de plano." />
    );
  }

  function setField<K extends keyof FormErrors>(field: K, value?: string) {
    setErrors((prev) => ({ ...prev, [field]: value }));
  }

  function validateForm() {
    const nextErrors: FormErrors = {};

    if (form.name.trim().length < 3) {
      nextErrors.name = "Informe o nome da empresa.";
    }

    if (form.cnpj.replace(/\D/g, "").length !== 14) {
      nextErrors.cnpj = "Digite um CNPJ válido com 14 números.";
    }

    if (form.contactName.trim() && form.contactName.trim().length < 3) {
      nextErrors.contactName = "Informe um nome válido para o responsável.";
    }

    if (
      form.contactPhone.trim() &&
      form.contactPhone.replace(/\D/g, "").length < 10
    ) {
      nextErrors.contactPhone = "Digite um telefone válido com DDD.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleProfileSubmit() {
    if (!validateForm()) {
      toast.error("Revise os campos antes de salvar.");
      return;
    }

    try {
      setSavingProfile(true);
      const response = await api.patch<CompanyProfile>("/companies/me", {
        name: form.name.trim(),
        cnpj: form.cnpj,
        contactName: form.contactName.trim() || null,
        contactPhone: form.contactPhone.trim() || null,
      });

      syncProfile(response.data);
      toast.success("Dados da empresa atualizados com sucesso.");
    } catch (error: unknown) {
      toast.error(
        getErrorMessage(error, "Não foi possível salvar as alterações."),
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePlanChangeRequest() {
    if (!profile) {
      return;
    }

    if (selectedPlan === profile.plan) {
      toast.error("Selecione um plano diferente do atual para criar a pendência.");
      return;
    }

    try {
      setSavingPlanChange(true);
      const response = await api.post<PlanChangeResponse>(
        "/companies/me/plan-change-request",
        {
          plan: selectedPlan,
        },
      );

      syncProfile(response.data.company);
      toast.success(response.data.message);
    } catch (error: unknown) {
      toast.error(
        getErrorMessage(
          error,
          "Não foi possível registrar a solicitação de mudança de plano.",
        ),
      );
    } finally {
      setSavingPlanChange(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-56 animate-pulse rounded-[30px] bg-muted/80" />
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="h-[420px] animate-pulse rounded-[30px] bg-muted/80" />
          <div className="h-[320px] animate-pulse rounded-[30px] bg-muted/60" />
        </div>
        <div className="h-[360px] animate-pulse rounded-[30px] bg-muted/70" />
      </div>
    );
  }

  const pendingRequest = profile?.pendingPlanChangeRequest ?? null;
  const currentPlan = profile?.plan ?? "ESSENTIAL";
  const selectedPlanMeta = companyPlanMeta[selectedPlan];
  const planButtonDisabled =
    !profile || selectedPlan === profile.plan || savingPlanChange;

  return (
    <div className="space-y-5">
      <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.12fr)_320px]">
        <Card className="rounded-[30px] border border-[#ffd7bf]/70 bg-[radial-gradient(circle_at_top_left,#fff3ea_0%,#ffffff_56%,#f8fafc_100%)] shadow-[0_24px_70px_rgba(15,23,42,0.08)] dark:border-[#3e2b21] dark:bg-[radial-gradient(circle_at_top_left,rgba(255,92,0,0.18)_0%,rgba(15,23,42,0.92)_52%,rgba(2,6,23,1)_100%)]">
          <CardHeader className="space-y-4">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#ffd8c2] bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#ff5c00] dark:border-[#5b3b2a] dark:bg-white/10 dark:text-[#ff9b66]">
              <Building2 className="size-4" />
              Central da empresa
            </div>

            <div className="space-y-3">
              <CardTitle className="max-w-3xl text-3xl font-semibold tracking-[-0.05em] text-slate-950 dark:text-white md:text-4xl">
                Dados da operação, contato principal e fluxo comercial no mesmo
                lugar.
              </CardTitle>
              <CardDescription className="max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                Mantenha o perfil institucional atualizado e acompanhe com
                clareza o status do plano da empresa, sem espaços sobrando e sem
                blocos quebrando no modo escuro.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {pendingRequest ? (
              <div className="rounded-[24px] border border-[#ffd7bf] bg-white/85 p-4 shadow-[0_14px_35px_rgba(255,92,0,0.08)] dark:border-[#5b3b2a] dark:bg-white/[0.07]">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-[#fff1e8] text-[#ff5c00] dark:bg-[#352217] dark:text-[#ff9b66]">
                    <Clock3 className="size-5" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-950 dark:text-white">
                      Solicitação de plano em andamento
                    </p>
                    <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                      O plano{" "}
                      <span className="font-semibold text-slate-950 dark:text-white">
                        {companyPlanMeta[pendingRequest.requestedPlan].label}
                      </span>{" "}
                      foi solicitado em {formatDateTime(pendingRequest.requestedAt)}.
                      Essa pendência já aparece para o dono da plataforma.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[24px] border border-border/70 bg-white/75 p-4 text-sm leading-6 text-slate-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300">
                O plano atual continua ativo até que uma mudança seja solicitada.
                Quando isso acontecer, a pendência aparecerá para o dono da
                plataforma com os contatos da sua empresa.
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Usuários"
                value={String(profile?._count.users ?? 0)}
                icon={<Users className="size-4" />}
              />
              <MetricCard
                label="Alunos"
                value={String(profile?._count.students ?? 0)}
                icon={<BookUserIcon className="size-4" />}
              />
              <MetricCard
                label="Ônibus"
                value={String(profile?._count.buses ?? 0)}
                icon={<Bus className="size-4" />}
              />
              <MetricCard
                label="UniHubs"
                value={String(profile?._count.devices ?? 0)}
                icon={<Cpu className="size-4" />}
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-5">
          <CompactPanel
            title="Plano atual"
            description={companyPlanMeta[currentPlan].description}
            value={companyPlanMeta[currentPlan].label}
            badgeClassName={planTheme[currentPlan].tag}
            icon={<Sparkles className="size-4" />}
          />

          <CompactPanel
            title="Domínio protegido"
            description="O domínio fica somente para consulta, evitando conflito com os acessos já cadastrados."
            value={profile ? `@${profile.emailDomain}` : "-"}
            icon={<ShieldCheck className="size-4" />}
          />
        </div>
      </section>

      <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="rounded-[30px] border border-border/70 bg-card/95 shadow-[0_20px_55px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#0f172a]/70">
          <CardHeader className="space-y-3">
            <CardTitle className="flex items-center gap-3 text-xl text-foreground">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-[#fff1e8] text-[#ff5c00] dark:bg-[#352217] dark:text-[#ff9b66]">
                <Building2 className="size-5" />
              </div>
              Perfil institucional
            </CardTitle>
            <CardDescription className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Atualize o nome da empresa, o CNPJ e o responsável principal para
              manter a operação e o relacionamento comercial sempre em ordem.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Nome da empresa"
                value={form.name}
                onChange={(value) => {
                  setForm((prev) => ({ ...prev, name: value }));
                  setField("name");
                }}
                placeholder="Tavares Transporte"
                error={errors.name}
              />
              <Field
                label="CNPJ"
                value={form.cnpj}
                onChange={(value) => {
                  setForm((prev) => ({ ...prev, cnpj: formatCnpj(value) }));
                  setField("cnpj");
                }}
                placeholder="00.000.000/0001-00"
                error={errors.cnpj}
              />
              <Field
                label="Responsável"
                value={form.contactName}
                onChange={(value) => {
                  setForm((prev) => ({ ...prev, contactName: value }));
                  setField("contactName");
                }}
                placeholder="Caique Alves"
                error={errors.contactName}
              />
              <Field
                label="Telefone principal"
                value={form.contactPhone}
                onChange={(value) => {
                  setForm((prev) => ({
                    ...prev,
                    contactPhone: formatPhone(value),
                  }));
                  setField("contactPhone");
                }}
                placeholder="(17) 98810-3154"
                error={errors.contactPhone}
              />
            </div>

            <div className="rounded-[24px] border border-border/70 bg-muted/35 p-4 dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  Ao salvar, os dados ficam disponíveis imediatamente para sua
                  equipe e também apoiam o contato comercial quando houver
                  alguma solicitação de plano.
                </p>

                <Button
                  type="button"
                  onClick={() => void handleProfileSubmit()}
                  disabled={savingProfile}
                  className="h-11 rounded-2xl bg-[#ff5c00] px-5 text-white hover:bg-[#eb5600]"
                >
                  {savingProfile ? "Salvando..." : "Salvar alterações"}
                  <Save className="size-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-5">
          <Card className="rounded-[30px] border border-white/10 bg-[#0f172a] text-white shadow-[0_20px_55px_rgba(15,23,42,0.16)]">
            <CardHeader className="space-y-3">
              <CardTitle className="text-xl text-white">
                Status de atendimento
              </CardTitle>
              <CardDescription className="text-sm leading-6 text-white/70">
                Acompanhe rapidamente se existe alguma solicitação aguardando
                ação da plataforma.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              <StatusItem
                label="Plano atual"
                value={profile ? companyPlanMeta[profile.plan].label : "-"}
              />
              <StatusItem
                label="Último pedido"
                value={
                  pendingRequest
                    ? companyPlanMeta[pendingRequest.requestedPlan].label
                    : "Nenhuma solicitação pendente"
                }
              />
              <StatusItem
                label="Última atualização"
                value={
                  pendingRequest
                    ? formatDateTime(pendingRequest.requestedAt)
                    : formatDate(profile?.createdAt)
                }
              />
            </CardContent>
          </Card>

          <Card className="rounded-[30px] border border-border/70 bg-card/95 shadow-[0_20px_55px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#0f172a]/70">
            <CardHeader className="space-y-3">
              <CardTitle className="text-xl text-foreground">
                Contato cadastrado
              </CardTitle>
              <CardDescription className="text-sm leading-6 text-muted-foreground">
                Esse resumo é o que sustenta o retorno comercial quando o dono
                da plataforma precisa falar com a sua operação.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              <InfoRow
                icon={<Users className="size-4" />}
                label="Responsável"
                value={profile?.contactName || "Responsável ainda não informado"}
              />
              <InfoRow
                icon={<Phone className="size-4" />}
                label="Telefone"
                value={
                  profile?.contactPhone
                    ? formatPhone(profile.contactPhone)
                    : "Telefone ainda não informado"
                }
              />
              <InfoRow
                icon={<BadgeCheck className="size-4" />}
                label="Telefone verificado"
                value={
                  profile?.smsVerifiedAt
                    ? formatDate(profile.smsVerifiedAt)
                    : "Ainda sem validação por SMS"
                }
              />
              <InfoRow
                icon={<FileText className="size-4" />}
                label="CNPJ"
                value={formatCnpj(profile?.cnpj ?? "") || "-"}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      <Card className="rounded-[30px] border border-border/70 bg-card/95 shadow-[0_20px_55px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#0f172a]/70">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <CardTitle className="flex items-center gap-3 text-2xl text-foreground">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-[#fff1e8] text-[#ff5c00] dark:bg-[#352217] dark:text-[#ff9b66]">
                  <ArrowRightLeft className="size-5" />
                </div>
                Solicitação de mudança de plano
              </CardTitle>
              <CardDescription className="max-w-3xl text-sm leading-6 text-muted-foreground">
                Escolha o próximo plano da empresa. A troca não é automática: a
                solicitação vira uma pendência visível para o dono da plataforma.
              </CardDescription>
            </div>

            <div className="rounded-full border border-border/70 bg-muted/40 px-4 py-2 text-sm font-medium text-foreground dark:border-white/10 dark:bg-white/[0.04] dark:text-white">
              Selecionado: {selectedPlanMeta.label}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="grid gap-4 xl:grid-cols-3">
            {companyPlanOrder.map((plan) => {
              const meta = companyPlanMeta[plan];
              const theme = planTheme[plan];
              const isCurrentPlan = profile?.plan === plan;
              const isSelected = selectedPlan === plan;
              const isPendingPlan =
                profile?.pendingPlanChangeRequest?.requestedPlan === plan;

              return (
                <button
                  key={plan}
                  type="button"
                  onClick={() => setSelectedPlan(plan)}
                  className={cn(
                    "rounded-[26px] border p-5 text-left transition-all duration-200",
                    "border-border/70 shadow-[0_10px_30px_rgba(15,23,42,0.04)] hover:-translate-y-0.5",
                    "dark:border-white/10",
                    theme.surface,
                    isSelected &&
                      "ring-2 ring-[#ff5c00]/70 shadow-[0_16px_40px_rgba(255,92,0,0.10)]",
                  )}
                >
                  <div
                    className={cn(
                      "h-1.5 w-20 rounded-full bg-gradient-to-r",
                      theme.accentBar,
                    )}
                  />

                  <div className="mt-4 flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        {meta.eyebrow}
                      </p>
                      <h2 className="text-2xl font-semibold text-foreground dark:text-white">
                        {meta.label}
                      </h2>
                    </div>

                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
                        isCurrentPlan
                          ? theme.tag
                          : isPendingPlan
                            ? "bg-amber-500 text-white"
                            : "border border-border/80 bg-background/80 text-foreground dark:border-white/10 dark:bg-white/[0.05] dark:text-white",
                      )}
                    >
                      {isCurrentPlan
                        ? "Atual"
                        : isPendingPlan
                          ? "Solicitado"
                          : "Disponível"}
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-muted-foreground dark:text-slate-300">
                    {meta.description}
                  </p>

                  <div className="mt-5 space-y-3">
                    {meta.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-3">
                        <div className={cn("mt-2 size-2 rounded-full", theme.dot)} />
                        <p className="text-sm leading-6 text-foreground/90 dark:text-slate-200">
                          {feature}
                        </p>
                      </div>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-[24px] border border-border/70 bg-muted/35 p-4 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground dark:text-white">
                  <span>Plano atual:</span>
                  <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", planTheme[currentPlan].tag)}>
                    {companyPlanMeta[currentPlan].label}
                  </span>
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  <span>Solicitação desejada:</span>
                  <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", planTheme[selectedPlan].tag)}>
                    {selectedPlanMeta.label}
                  </span>
                </div>
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                  Quando você enviar a solicitação, o plano atual continua ativo
                  até que o dono da plataforma entre em contato e conclua a
                  mudança.
                </p>
              </div>

              <Button
                type="button"
                onClick={() => void handlePlanChangeRequest()}
                disabled={planButtonDisabled}
                className="h-11 rounded-2xl bg-[#ff5c00] px-5 text-white hover:bg-[#eb5600]"
              >
                {savingPlanChange
                  ? "Enviando..."
                  : pendingRequest
                    ? "Atualizar solicitação"
                    : "Solicitar mudança de plano"}
                <Sparkles className="size-4" />
              </Button>
            </div>
          </div>
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
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cn(
          "h-12 rounded-2xl border-border/70 bg-background px-4 text-foreground dark:border-white/10 dark:bg-white/[0.04]",
          error && "border-destructive",
        )}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-[22px] border border-border/70 bg-card/80 p-4 dark:border-white/10 dark:bg-white/[0.05]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
        <div className="text-[#ff5c00]">{icon}</div>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-foreground dark:text-white">
        {value}
      </p>
    </div>
  );
}

function CompactPanel({
  title,
  value,
  description,
  icon,
  badgeClassName,
}: {
  title: string;
  value: string;
  description: string;
  icon: ReactNode;
  badgeClassName?: string;
}) {
  return (
    <Card className="rounded-[30px] border border-border/70 bg-card/95 shadow-[0_20px_55px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#0f172a]/70">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <span className="text-[#ff5c00]">{icon}</span>
            {title}
          </div>
          {badgeClassName ? (
            <span
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
                badgeClassName,
              )}
            >
              Ativo
            </span>
          ) : null}
        </div>
        <CardTitle className="text-xl text-foreground dark:text-white">
          {value}
        </CardTitle>
        <CardDescription className="text-sm leading-6 text-muted-foreground dark:text-slate-300">
          {description}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/35 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="text-[#ff5c00]">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-sm text-foreground/90 dark:text-slate-200">
          {value}
        </p>
      </div>
    </div>
  );
}

function StatusItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/55">
        {label}
      </p>
      <p className="mt-1 text-sm text-white">{value}</p>
    </div>
  );
}
