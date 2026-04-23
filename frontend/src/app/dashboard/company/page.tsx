"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Building2,
  CheckCircle2,
  FileText,
  Phone,
  Save,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/app/contexts/AuthContext";
import { AccessDenied } from "@/components/AccessDenied";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import api from "@/services/api";

type CompanyProfile = {
  id: string;
  name: string;
  cnpj: string;
  emailDomain: string;
  plan: "ESSENTIAL" | "GROWTH" | "SCALE";
  contactName: string | null;
  contactPhone: string | null;
  smsVerifiedAt: string | null;
  createdAt: string;
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

const planLabels: Record<CompanyProfile["plan"], string> = {
  ESSENTIAL: "Essential",
  GROWTH: "Growth",
  SCALE: "Scale",
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

  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function CompanyPage() {
  const { user } = useAuth();
  const canManage = user?.role === "ADMIN";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [form, setForm] = useState({
    name: "",
    cnpj: "",
    contactName: "",
    contactPhone: "",
  });

  useEffect(() => {
    if (!canManage) {
      setLoading(false);
      return;
    }

    async function fetchCompany() {
      try {
        const response = await api.get<CompanyProfile>("/companies/me");
        const nextProfile = response.data;

        setProfile(nextProfile);
        setForm({
          name: nextProfile.name,
          cnpj: formatCnpj(nextProfile.cnpj),
          contactName: nextProfile.contactName ?? "",
          contactPhone: formatPhone(nextProfile.contactPhone ?? ""),
        });
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
      <AccessDenied description="Somente o administrador da empresa pode editar os dados institucionais." />
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

  async function handleSubmit() {
    if (!validateForm()) {
      toast.error("Revise os campos antes de salvar.");
      return;
    }

    try {
      setSaving(true);
      const response = await api.patch<CompanyProfile>("/companies/me", {
        name: form.name,
        cnpj: form.cnpj,
        contactName: form.contactName || null,
        contactPhone: form.contactPhone || null,
      });

      const updatedProfile: CompanyProfile = {
        ...(profile ?? {
          _count: { users: 0, students: 0, buses: 0, devices: 0 },
        }),
        ...response.data,
      };

      setProfile(updatedProfile);
      setForm({
        name: updatedProfile.name,
        cnpj: formatCnpj(updatedProfile.cnpj),
        contactName: updatedProfile.contactName ?? "",
        contactPhone: formatPhone(updatedProfile.contactPhone ?? ""),
      });
      toast.success("Dados da empresa atualizados com sucesso.");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Não foi possível salvar as alterações."));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-9 w-48 animate-pulse rounded bg-muted" />
          <div className="h-5 w-72 animate-pulse rounded bg-muted/70" />
        </div>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="h-[420px] animate-pulse rounded-3xl bg-muted" />
          <div className="h-[420px] animate-pulse rounded-3xl bg-muted/80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#ff5c00]">
          Empresa
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-foreground">
          Edite os dados institucionais da sua operação.
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Atualize nome, CNPJ e contato principal da empresa sem mexer no
          domínio que hoje sustenta os acessos e cadastros vinculados.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="rounded-[30px] border-white/70 bg-white/85 shadow-[0_24px_60px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#1f2127]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-[#fff1e8] text-[#ff5c00] dark:bg-[#3a2618]">
                <Building2 className="size-5" />
              </div>
              Perfil da empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
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
                label="Responsavel"
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

            <div className="grid gap-4 rounded-[28px] border border-[#ecebe5] bg-[#fafaf7] p-4 dark:border-white/10 dark:bg-[#17191f] md:grid-cols-2">
              <ReadOnlyField
                label="Domínio da empresa"
                value={profile ? `@${profile.emailDomain}` : "-"}
                icon={<ShieldCheck className="size-4" />}
              />
              <ReadOnlyField
                label="Plano atual"
                value={profile ? planLabels[profile.plan] : "-"}
                icon={<Sparkles className="size-4" />}
              />
            </div>

            <div className="flex flex-col gap-3 border-t border-black/6 pt-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Alteracoes salvas refletem imediatamente no painel da empresa.
              </p>

              <Button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={saving}
                className="h-11 rounded-2xl bg-[#ff5c00] px-5 text-white hover:bg-[#eb5600]"
              >
                {saving ? "Salvando..." : "Salvar alterações"}
                <Save className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <aside className="space-y-4">
          <Card className="rounded-[30px] border-white/75 bg-white/82 shadow-[0_20px_55px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#1f2127]">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Resumo rápido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <SummaryRow label="Usuários" value={String(profile?._count.users ?? 0)} />
              <SummaryRow label="Alunos" value={String(profile?._count.students ?? 0)} />
              <SummaryRow label="Ônibus" value={String(profile?._count.buses ?? 0)} />
              <SummaryRow label="UniHubs" value={String(profile?._count.devices ?? 0)} />
            </CardContent>
          </Card>

          <Card className="rounded-[30px] border-[#ffe1ce] bg-[linear-gradient(180deg,#fff7f2_0%,#ffffff_100%)] shadow-[0_20px_55px_rgba(255,92,0,0.08)] dark:border-[#5b341c] dark:bg-[linear-gradient(180deg,#2c211b_0%,#1f1916_100%)]">
            <CardContent className="space-y-4 p-5">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-[#fff1e8] text-[#ff5c00] dark:bg-[#3a2618]">
                <CheckCircle2 className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Domínio protegido
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  O domínio institucional ficou apenas para consulta nesta tela
                  para evitar conflito com usuarios e alunos ja vinculados.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[30px] border-white/75 bg-white/82 shadow-[0_20px_55px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#1f2127]">
            <CardContent className="space-y-3 p-5 text-sm text-muted-foreground">
              <InfoRow
                icon={<FileText className="size-4" />}
                text={`CNPJ atual: ${formatCnpj(profile?.cnpj ?? "") || "-"}`}
              />
              <InfoRow
                icon={<Phone className="size-4" />}
                text={
                  profile?.contactPhone
                    ? formatPhone(profile.contactPhone)
                    : "Telefone ainda não informado"
                }
              />
            </CardContent>
          </Card>
        </aside>
      </div>
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
          "h-12 rounded-2xl border-[#e6e1db] bg-white px-4 dark:border-white/12 dark:bg-[#17191f]",
          error && "border-destructive",
        )}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function ReadOnlyField({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-white/80 bg-white px-4 py-4 dark:border-white/10 dark:bg-[#20232b]">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#8b8b85]">
        {icon}
        {label}
      </div>
      <p className="mt-2 break-all text-sm font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#f0efe9] bg-[#fafaf7] px-4 py-3 dark:border-white/10 dark:bg-[#17191f]">
      <p className="text-xs uppercase tracking-[0.14em] text-[#8b8b85]">{label}</p>
      <p className="mt-1 text-lg font-semibold tracking-[-0.04em] text-foreground">
        {value}
      </p>
    </div>
  );
}

function InfoRow({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#f0efe9] bg-[#fafaf7] px-4 py-3 dark:border-white/10 dark:bg-[#17191f]">
      <div className="text-[#ff5c00]">{icon}</div>
      <p>{text}</p>
    </div>
  );
}
