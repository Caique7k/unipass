"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  ArrowRightLeft,
  BookUserIcon,
  Building2,
  Bus,
  CheckCircle2,
  Clock3,
  Cpu,
  Mail,
  Phone,
  Sparkles,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/app/contexts/AuthContext";
import { AccessDenied } from "@/components/AccessDenied";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CompanyPlan, companyPlanMeta } from "@/lib/company-plans";
import api from "@/services/api";
import { CompaniesSkeleton } from "../components/DashboardSkeletons";

type PendingPlanChangeRequest = {
  currentPlan: CompanyPlan;
  requestedPlan: CompanyPlan;
  requestedAt: string;
  requestedByName: string | null;
  requestedByEmail: string | null;
};

type Company = {
  id: string;
  name: string;
  cnpj: string;
  emailDomain: string;
  plan: CompanyPlan;
  contactName: string | null;
  contactPhone: string | null;
  createdAt: string;
  pendingPlanChangeRequest: PendingPlanChangeRequest | null;
  _count: {
    users: number;
    students: number;
    buses: number;
    devices: number;
  };
};

type ApplyPlanResponse = {
  message: string;
  company: Company;
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

function formatPhone(value?: string | null) {
  if (!value) {
    return "Telefone não informado";
  }

  const digits = value.replace(/\D/g, "").replace(/^55/, "").slice(0, 11);

  if (!digits) return "Telefone não informado";
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "Sem data";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDate(value?: string | null) {
  if (!value) {
    return "Sem data";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export default function CompaniesPage() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingCompanyId, setApplyingCompanyId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (user?.role !== "PLATFORM_ADMIN") {
      setLoading(false);
      return;
    }

    async function fetchCompanies() {
      try {
        const response = await api.get<Company[]>("/companies");
        setCompanies(response.data);
      } catch (error: unknown) {
        toast.error(
          getErrorMessage(error, "Não foi possível carregar as empresas."),
        );
      } finally {
        setLoading(false);
      }
    }

    void fetchCompanies();
  }, [user?.role]);

  async function handleApplyRequestedPlan(companyId: string) {
    try {
      setApplyingCompanyId(companyId);
      const response = await api.patch<ApplyPlanResponse>(
        `/companies/${companyId}/apply-requested-plan`,
      );

      setCompanies((current) =>
        current.map((company) =>
          company.id === response.data.company.id ? response.data.company : company,
        ),
      );

      toast.success(response.data.message);
    } catch (error: unknown) {
      toast.error(
        getErrorMessage(
          error,
          "Não foi possível aplicar o plano solicitado agora.",
        ),
      );
    } finally {
      setApplyingCompanyId(null);
    }
  }

  if (user?.role !== "PLATFORM_ADMIN") {
    return (
      <AccessDenied description="Somente o dono da plataforma pode acessar a visão global de empresas e pendências de plano." />
    );
  }

  if (loading) {
    return <CompaniesSkeleton />;
  }

  const pendingCompanies = [...companies]
    .filter((company) => company.pendingPlanChangeRequest)
    .sort((left, right) => {
      const leftDate = new Date(
        left.pendingPlanChangeRequest?.requestedAt ?? left.createdAt,
      ).getTime();
      const rightDate = new Date(
        right.pendingPlanChangeRequest?.requestedAt ?? right.createdAt,
      ).getTime();

      return rightDate - leftDate;
    });

  const totals = companies.reduce(
    (acc, company) => {
      acc.users += company._count.users;
      acc.students += company._count.students;
      acc.buses += company._count.buses;
      acc.devices += company._count.devices;
      return acc;
    },
    {
      users: 0,
      students: 0,
      buses: 0,
      devices: 0,
    },
  );

  return (
    <div className="space-y-6">
      <Card className="rounded-[34px] border border-[#ffd7bf]/70 bg-[radial-gradient(circle_at_top_left,#fff2e8_0%,#ffffff_44%,#f4f7fb_100%)] p-6 shadow-[0_28px_70px_rgba(15,23,42,0.09)] dark:border-[#3a2b22] dark:bg-[radial-gradient(circle_at_top_left,rgba(255,92,0,0.14)_0%,rgba(19,27,40,0.96)_45%,rgba(2,6,23,1)_100%)] md:p-8">
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#ffd8c2] bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#ff5c00] dark:border-[#5a3b2a] dark:bg-white/8 dark:text-[#ff9b66]">
              <Building2 className="size-4" />
              Visão da plataforma
            </div>

            <div className="space-y-3">
              <h1 className="max-w-3xl text-3xl font-semibold tracking-[-0.05em] text-slate-950 dark:text-white md:text-4xl">
                Empresas, planos e pendências em um painel pronto para ação.
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                Aqui você acompanha a carteira de empresas da UniPass, enxerga
                quais planos estão ativos e trata rapidamente as solicitações
                enviadas pelos administradores.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Empresas"
                value={String(companies.length)}
                icon={<Building2 className="size-4" />}
              />
              <MetricCard
                label="Pendências"
                value={String(pendingCompanies.length)}
                icon={<Clock3 className="size-4" />}
              />
              <MetricCard
                label="Usuários"
                value={String(totals.users)}
                icon={<Users className="size-4" />}
              />
              <MetricCard
                label="UniHubs"
                value={String(totals.devices)}
                icon={<Cpu className="size-4" />}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[28px] border border-border/70 bg-card/85 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-white/[0.05]">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Resumo operacional
              </p>
              <div className="mt-4 space-y-3">
                <SummaryRow
                  icon={<BookUserIcon className="size-4" />}
                  label="Alunos"
                  value={String(totals.students)}
                />
                <SummaryRow
                  icon={<Bus className="size-4" />}
                  label="Ônibus"
                  value={String(totals.buses)}
                />
                <SummaryRow
                  icon={<Sparkles className="size-4" />}
                  label="Empresas com pedido"
                  value={String(pendingCompanies.length)}
                />
              </div>
            </div>

            <div className="rounded-[28px] border border-[#ffe0ce] bg-[linear-gradient(180deg,#fff7f2_0%,#ffffff_100%)] p-5 shadow-[0_18px_45px_rgba(255,92,0,0.09)] dark:border-[#5a3b2a] dark:bg-[linear-gradient(180deg,rgba(53,34,23,0.9)_0%,rgba(17,24,39,0.7)_100%)]">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-[#fff1e8] text-[#ff5c00] dark:bg-[#352217] dark:text-[#ff9b66]">
                <CheckCircle2 className="size-5" />
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-950 dark:text-white">
                Fluxo recomendado
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Quando uma empresa solicitar troca de plano, você já encontra o
                contato principal e o solicitante na própria pendência. Depois
                do alinhamento, basta aplicar o plano solicitado.
              </p>
            </div>
          </div>
        </div>
      </Card>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">
            Solicitações pendentes
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Essas solicitações aparecem assim que o administrador da empresa
            pede a troca de plano.
          </p>
        </div>

        {pendingCompanies.length === 0 ? (
          <Card className="rounded-[30px] border border-dashed border-slate-300 bg-white/80 p-8 text-center shadow-[0_18px_45px_rgba(15,23,42,0.05)] dark:border-white/15 dark:bg-white/[0.04]">
            <div className="mx-auto flex size-14 items-center justify-center rounded-3xl bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300">
              <Clock3 className="size-6" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">
              Nenhuma pendência de plano no momento
            </h3>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Assim que alguma empresa solicitar uma mudança, o pedido aparece
              aqui com os contatos certos para você tratar o assunto.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {pendingCompanies.map((company) => {
              const pendingRequest = company.pendingPlanChangeRequest!;

              return (
                <Card
                  key={company.id}
                  className="rounded-[30px] border border-[#ffd8c2] bg-white/95 p-6 shadow-[0_20px_50px_rgba(255,92,0,0.08)] dark:border-[#5a3b2a] dark:bg-[#111827]/88"
                >
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-[#fff1e8] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#ff5c00] dark:bg-[#352217] dark:text-[#ff9b66]">
                          <Clock3 className="size-3.5" />
                          Pendente
                        </div>
                        <h3 className="mt-3 text-xl font-semibold text-slate-950 dark:text-white">
                          {company.name}
                        </h3>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                          @{company.emailDomain} • {formatCnpj(company.cnpj)}
                        </p>
                      </div>

                      <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/[0.05]">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                          Solicitado em
                        </p>
                        <p className="mt-1 font-medium text-slate-950 dark:text-white">
                          {formatDateTime(pendingRequest.requestedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/[0.05]">
                      <div className="flex items-center gap-3">
                        <div className="flex size-11 items-center justify-center rounded-2xl bg-[#fff1e8] text-[#ff5c00] dark:bg-[#352217] dark:text-[#ff9b66]">
                          <ArrowRightLeft className="size-5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                            Mudança solicitada
                          </p>
                          <p className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">
                            {companyPlanMeta[pendingRequest.currentPlan].label} para{" "}
                            {companyPlanMeta[pendingRequest.requestedPlan].label}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <ContactCard
                        icon={<Users className="size-4" />}
                        label="Responsável da empresa"
                        primary={company.contactName || "Responsável não informado"}
                        secondary={formatPhone(company.contactPhone)}
                      />
                      <ContactCard
                        icon={<Mail className="size-4" />}
                        label="Quem solicitou"
                        primary={
                          pendingRequest.requestedByName || "Administrador da empresa"
                        }
                        secondary={
                          pendingRequest.requestedByEmail || "E-mail não informado"
                        }
                      />
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {company.contactPhone ? (
                        <a
                          href={`tel:${company.contactPhone}`}
                          className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100 dark:hover:bg-white/[0.08]"
                        >
                          <Phone className="mr-2 size-4" />
                          Ligar para responsável
                        </a>
                      ) : null}

                      {pendingRequest.requestedByEmail ? (
                        <a
                          href={`mailto:${pendingRequest.requestedByEmail}`}
                          className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100 dark:hover:bg-white/[0.08]"
                        >
                          <Mail className="mr-2 size-4" />
                          Falar com solicitante
                        </a>
                      ) : null}

                      <Button
                        type="button"
                        onClick={() => void handleApplyRequestedPlan(company.id)}
                        disabled={applyingCompanyId === company.id}
                        className="h-11 rounded-2xl bg-[#ff5c00] px-5 text-white hover:bg-[#eb5600]"
                      >
                        {applyingCompanyId === company.id
                          ? "Aplicando..."
                          : "Aplicar plano solicitado"}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">
            Empresas cadastradas
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Panorama geral da base ativa da plataforma UniPass.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {companies.map((company) => {
            const planMeta = companyPlanMeta[company.plan];

            return (
              <Card
                key={company.id}
                className="rounded-[28px] border border-white/70 bg-white/92 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#111827]/82"
              >
                <div className="flex h-full flex-col gap-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
                        {company.name}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        @{company.emailDomain}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${planMeta.badgeClassName}`}
                    >
                      {planMeta.label}
                    </span>
                  </div>

                  {company.pendingPlanChangeRequest ? (
                    <div className="rounded-2xl border border-[#ffd8c2] bg-[#fff7f1] px-4 py-3 text-sm text-slate-700 dark:border-[#5a3b2a] dark:bg-[#2a1b15] dark:text-slate-200">
                      <p className="font-semibold text-slate-950 dark:text-white">
                        Pendência aberta
                      </p>
                      <p className="mt-1 leading-6">
                        Pedido para{" "}
                        {
                          companyPlanMeta[
                            company.pendingPlanChangeRequest.requestedPlan
                          ].label
                        }{" "}
                        em {formatDateTime(company.pendingPlanChangeRequest.requestedAt)}.
                      </p>
                    </div>
                  ) : null}

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <MiniMetric
                      label="Usuários"
                      value={String(company._count.users)}
                    />
                    <MiniMetric
                      label="Alunos"
                      value={String(company._count.students)}
                    />
                    <MiniMetric
                      label="Ônibus"
                      value={String(company._count.buses)}
                    />
                    <MiniMetric
                      label="UniHubs"
                      value={String(company._count.devices)}
                    />
                  </div>

                  <div className="space-y-3">
                    <DetailRow
                      icon={<Users className="size-4" />}
                      label="Responsável"
                      value={company.contactName || "Não informado"}
                    />
                    <DetailRow
                      icon={<Phone className="size-4" />}
                      label="Telefone"
                      value={formatPhone(company.contactPhone)}
                    />
                    <DetailRow
                      icon={<Clock3 className="size-4" />}
                      label="Cadastro"
                      value={formatDate(company.createdAt)}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>
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
    <div className="rounded-[26px] border border-border/70 bg-card/80 p-4 shadow-[0_14px_35px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-white/[0.05]">
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

function SummaryRow({
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
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
        <p className="text-sm font-medium text-foreground dark:text-white">
          {value}
        </p>
      </div>
    </div>
  );
}

function ContactCard({
  icon,
  label,
  primary,
  secondary,
}: {
  icon: ReactNode;
  label: string;
  primary: string;
  secondary: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/[0.05]">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
        <span className="text-[#ff5c00]">{icon}</span>
        {label}
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-950 dark:text-white">
        {primary}
      </p>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        {secondary}
      </p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">
        {value}
      </p>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
      <div className="text-[#ff5c00]">{icon}</div>
      <span className="font-medium text-slate-950 dark:text-white">{label}:</span>
      <span>{value}</span>
    </div>
  );
}
