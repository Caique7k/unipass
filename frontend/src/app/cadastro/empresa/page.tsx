"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import api from "@/services/api";

const steps = [
  { id: 1, label: "Empresa", icon: Building2 },
  { id: 2, label: "SMS", icon: Smartphone },
  { id: 3, label: "Plano", icon: Sparkles },
  { id: 4, label: "Acesso", icon: ShieldCheck },
];

const plans = [
  {
    id: "ESSENTIAL",
    name: "Essential",
    price: "R$ 249/mês",
    description: "Para operações iniciando com visibilidade e cadastros centralizados.",
    features: ["Painel operacional", "Domínio da empresa", "Usuários e alunos"],
  },
  {
    id: "GROWTH",
    name: "Growth",
    price: "R$ 499/mês",
    description: "Para operações que já precisam de ritmo, dispositivos e time maior.",
    features: ["Tudo do Essential", "Mais dispositivos", "Mais coordenação"],
  },
  {
    id: "SCALE",
    name: "Scale",
    price: "Sob consulta",
    description: "Para empresas com múltiplas frentes e rollout mais robusto.",
    features: ["Suporte prioritário", "Implantação assistida", "Escala institucional"],
  },
];

type DomainState = {
  available: boolean;
  normalizedDomain: string;
  suggestions: string[];
  message?: string;
} | null;

function getErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response &&
    typeof error.response.data === "object" &&
    error.response.data !== null &&
    "message" in error.response.data &&
    typeof error.response.data.message === "string"
  ) {
    return error.response.data.message;
  }

  return fallback;
}

export default function CompanyOnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [checkingDomain, setCheckingDomain] = useState(false);
  const [domainState, setDomainState] = useState<DomainState>(null);
  const [smsCode, setSmsCode] = useState("");
  const [smsSent, setSmsSent] = useState(false);
  const [smsVerified, setSmsVerified] = useState(false);
  const [sendingSms, setSendingSms] = useState(false);
  const [verifyingSms, setVerifyingSms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ loginEmail: string; plan: string } | null>(
    null,
  );
  const [developmentSmsCode, setDevelopmentSmsCode] = useState("");
  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    phone: "",
    cnpj: "",
    domain: "",
    plan: "GROWTH",
    adminName: "",
    adminLogin: "",
    password: "",
    confirmPassword: "",
  });

  const selectedPlan = plans.find((plan) => plan.id === form.plan) ?? plans[1];
  const adminEmailPreview = useMemo(() => {
    const normalizedDomain = domainState?.normalizedDomain ?? form.domain.replace(/^@+/, "");

    if (!form.adminLogin.trim()) {
      return normalizedDomain ? `@${normalizedDomain}` : "";
    }

    return normalizedDomain
      ? `${form.adminLogin.trim().toLowerCase()}@${normalizedDomain}`
      : form.adminLogin.trim().toLowerCase();
  }, [domainState?.normalizedDomain, form.adminLogin, form.domain]);

  async function handleCheckDomain(nextDomain?: string) {
    const domain = (nextDomain ?? form.domain).trim();

    if (!domain) {
      toast.error("Informe um domínio para validar.");
      return false;
    }

    try {
      setCheckingDomain(true);
      const response = await api.post("/companies/domain-check", { domain });
      setDomainState(response.data);
      setForm((prev) => ({ ...prev, domain: response.data.normalizedDomain }));

      if (!response.data.available) {
        toast.error(response.data.message ?? "Este domínio já está em uso.");
        return false;
      }

      toast.success("Domínio disponível.");
      return true;
    } catch (error: unknown) {
      setDomainState(null);
      toast.error(getErrorMessage(error, "Não foi possível validar o domínio."));
      return false;
    } finally {
      setCheckingDomain(false);
    }
  }

  async function handleSendSms() {
    if (!form.phone.trim()) {
      toast.error("Informe o celular da empresa.");
      return;
    }

    try {
      setSendingSms(true);
      const response = await api.post("/companies/onboarding/sms/send", {
        phone: form.phone,
      });

      setSmsSent(true);
      setDevelopmentSmsCode(response.data.developmentCode ?? "");
      toast.success("Código enviado por SMS.");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Erro ao enviar SMS."));
    } finally {
      setSendingSms(false);
    }
  }

  async function handleVerifySms() {
    if (smsCode.trim().length !== 6) {
      toast.error("Digite o código de 6 dígitos.");
      return;
    }

    try {
      setVerifyingSms(true);
      await api.post("/companies/onboarding/sms/verify", {
        phone: form.phone,
        code: smsCode,
      });

      setSmsVerified(true);
      toast.success("Celular verificado com sucesso.");
      setCurrentStep(3);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Código inválido."));
    } finally {
      setVerifyingSms(false);
    }
  }

  async function handleSubmit() {
    if (form.password.length < 6) {
      toast.error("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error("As senhas não conferem.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.post("/companies/onboarding", {
        companyName: form.companyName,
        contactName: form.contactName,
        phone: form.phone,
        cnpj: form.cnpj,
        domain: domainState?.normalizedDomain ?? form.domain,
        plan: form.plan,
        adminName: form.adminName,
        adminLogin: form.adminLogin,
        password: form.password,
      });

      setSuccess({
        loginEmail: response.data.loginEmail,
        plan: response.data.plan,
      });
      toast.success("Empresa cadastrada com sucesso.");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Erro ao concluir o cadastro."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleNextStep() {
    if (currentStep === 1) {
      if (
        !form.companyName.trim() ||
        !form.contactName.trim() ||
        !form.phone.trim() ||
        !form.cnpj.trim()
      ) {
        toast.error("Preencha os dados principais da empresa antes de continuar.");
        return;
      }

      const ok = await handleCheckDomain();
      if (!ok) return;
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      if (!smsVerified) {
        toast.error("Confirme o código SMS antes de seguir.");
        return;
      }

      setCurrentStep(3);
      return;
    }

    if (currentStep === 3) {
      setCurrentStep(4);
    }
  }

  if (success) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#fbfbfd_0%,#f5f5f7_36%,#ffffff_100%)] px-6 py-10 text-[#111111] sm:px-8">
        <div className="mx-auto flex min-h-[80vh] max-w-3xl items-center">
          <Card className="w-full rounded-[36px] border-white/80 bg-white/85 p-4 shadow-[0_30px_100px_rgba(15,23,42,0.10)] backdrop-blur-2xl">
            <CardContent className="space-y-6 p-6 sm:p-10">
              <div className="flex size-16 items-center justify-center rounded-3xl bg-[#ecf8f1] text-[#17803d]">
                <CheckCircle2 className="size-8" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#17803d]">
                  Cadastro concluído
                </p>
                <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em]">
                  Sua empresa já pode entrar no UniPass.
                </h1>
                <p className="mt-4 text-base leading-8 text-[#5f5f5a]">
                  O administrador inicial foi criado com o e-mail <strong>{success.loginEmail}</strong>.
                  O plano selecionado foi <strong>{success.plan}</strong>.
                </p>
              </div>

              <div className="rounded-[28px] border border-[#e5e7eb] bg-[#fafaf8] p-5 text-sm text-[#575752]">
                Próximo passo: entre no painel, cadastre seus alunos com o domínio da empresa
                e depois crie os acessos dos alunos a partir desses cadastros.
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#ff5c00] px-6 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(255,92,0,0.22)] transition hover:bg-[#eb5600]"
                >
                  Ir para o login
                </Link>
                <Link
                  href="/"
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-[#deded7] bg-white px-6 text-sm font-semibold text-[#1f1f1c] transition hover:bg-[#fafaf7]"
                >
                  Voltar para a landing page
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#fbfbfd_0%,#f5f5f7_36%,#ffffff_100%)] px-6 py-6 text-[#111111] sm:px-8 lg:px-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-12rem] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-white/90 blur-3xl" />
        <div className="absolute right-[-8rem] top-20 h-[24rem] w-[24rem] rounded-full bg-[#e7eefc]/52 blur-3xl" />
        <div className="absolute bottom-[-10rem] left-[-6rem] h-[20rem] w-[20rem] rounded-full bg-[#ffe6d2]/50 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className="flex items-center justify-between rounded-full border border-white/70 bg-white/60 px-5 py-3 shadow-[0_10px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#3b3b37]"
          >
            <ArrowLeft className="size-4" />
            Voltar
          </Link>
          <p className="hidden text-sm text-[#666661] sm:block">
            Onboarding da empresa em 4 etapas
          </p>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[40px] border border-white/80 bg-white/72 p-5 shadow-[0_30px_100px_rgba(15,23,42,0.08)] backdrop-blur-2xl sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const active = step.id === currentStep;
                const completed = step.id < currentStep || (step.id === 2 && smsVerified);

                return (
                  <div key={step.id} className="flex items-center gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex size-11 items-center justify-center rounded-2xl border text-sm font-semibold transition ${
                          active
                            ? "border-[#ff5c00] bg-[#fff1e8] text-[#ff5c00]"
                            : completed
                              ? "border-[#bde4c8] bg-[#ecf8f1] text-[#17803d]"
                              : "border-[#e6e6df] bg-white text-[#7a7a74]"
                        }`}
                      >
                        {completed ? <CheckCircle2 className="size-5" /> : <Icon className="size-5" />}
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-[#84847f]">
                          Etapa {step.id}
                        </p>
                        <p className="text-sm font-semibold text-[#111111]">{step.label}</p>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div className="hidden h-px w-8 bg-[#deded7] sm:block" />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-8">
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7a74]">
                      Empresa
                    </p>
                    <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em]">
                      Comece pelo domínio e identidade da operação.
                    </h1>
                    <p className="mt-4 max-w-2xl text-base leading-8 text-[#5f5f5a]">
                      Esse domínio será a assinatura da sua empresa no UniPass e vai
                      amarrar alunos, usuários e acessos.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Nome da empresa" value={form.companyName} onChange={(value) => setForm((prev) => ({ ...prev, companyName: value }))} placeholder="Tavares Transporte" />
                    <Field label="Responsável" value={form.contactName} onChange={(value) => setForm((prev) => ({ ...prev, contactName: value }))} placeholder="Caique Alves" />
                    <Field label="Celular" value={form.phone} onChange={(value) => setForm((prev) => ({ ...prev, phone: value }))} placeholder="(17) 98810-3154" />
                    <Field label="CNPJ" value={form.cnpj} onChange={(value) => setForm((prev) => ({ ...prev, cnpj: value }))} placeholder="00.000.000/0001-00" />
                  </div>

                  <div className="rounded-[28px] border border-[#ecebe5] bg-[#fafaf7] p-4 sm:p-5">
                    <p className="text-sm font-semibold text-[#111111]">Domínio institucional</p>
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                      <Input
                        value={form.domain}
                        onChange={(e) => {
                          setDomainState(null);
                          setForm((prev) => ({ ...prev, domain: e.target.value }));
                        }}
                        placeholder="tavarestransporte.com.br"
                        className="h-12 rounded-2xl border-[#e6e1db] bg-white px-4"
                      />
                      <Button type="button" onClick={() => void handleCheckDomain()} disabled={checkingDomain} className="h-12 rounded-2xl bg-[#111111] px-5 text-white hover:bg-[#222222]">
                        {checkingDomain ? "Validando..." : "Validar domínio"}
                      </Button>
                    </div>

                    {domainState && (
                      <div className="mt-4 space-y-3">
                        <p className={`text-sm ${domainState.available ? "text-[#17803d]" : "text-[#b54708]"}`}>
                          {domainState.available
                            ? `Domínio liberado: ${domainState.normalizedDomain}`
                            : domainState.message}
                        </p>

                        {!domainState.available && domainState.suggestions.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {domainState.suggestions.map((suggestion) => (
                              <button
                                key={suggestion}
                                type="button"
                                onClick={() => {
                                  setForm((prev) => ({ ...prev, domain: suggestion }));
                                  void handleCheckDomain(suggestion);
                                }}
                                className="rounded-full border border-[#ffd8c1] bg-white px-3 py-1.5 text-sm text-[#7a4a29] transition hover:bg-[#fff4ed]"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7a74]">
                      Verificação
                    </p>
                    <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em]">
                      Confirme o celular da operação.
                    </h1>
                    <p className="mt-4 max-w-2xl text-base leading-8 text-[#5f5f5a]">
                      Antes de liberar o ambiente, confirmamos o número principal da empresa.
                    </p>
                  </div>

                  <div className="rounded-[30px] border border-[#ecebe5] bg-[#fafaf7] p-5">
                    <p className="text-sm font-medium text-[#111111]">
                      Celular informado: <strong>{form.phone}</strong>
                    </p>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                      <Button type="button" onClick={() => void handleSendSms()} disabled={sendingSms} className="h-12 rounded-2xl bg-[#ff5c00] px-5 text-white hover:bg-[#eb5600]">
                        {sendingSms ? "Enviando..." : smsSent ? "Reenviar código" : "Enviar código"}
                      </Button>
                      <Input
                        value={smsCode}
                        onChange={(e) => setSmsCode(e.target.value)}
                        placeholder="Digite os 6 dígitos"
                        className="h-12 rounded-2xl border-[#e6e1db] bg-white px-4 sm:max-w-xs"
                      />
                      <Button type="button" onClick={() => void handleVerifySms()} disabled={verifyingSms || !smsSent} className="h-12 rounded-2xl border border-[#deded7] bg-white px-5 text-[#1f1f1c] hover:bg-[#fafaf7]">
                        {verifyingSms ? "Validando..." : "Confirmar"}
                      </Button>
                    </div>

                    {developmentSmsCode && (
                      <p className="mt-4 text-sm text-[#7a7068]">
                        Ambiente local: código de desenvolvimento <strong>{developmentSmsCode}</strong>
                      </p>
                    )}

                    {smsVerified && (
                      <p className="mt-4 text-sm font-medium text-[#17803d]">
                        Celular confirmado. Você já pode seguir para o plano.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7a74]">
                      Plano
                    </p>
                    <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em]">
                      Escolha o ritmo ideal para a implantação.
                    </h1>
                    <p className="mt-4 max-w-2xl text-base leading-8 text-[#5f5f5a]">
                      Você pode começar com um plano simples e evoluir depois sem trocar o domínio.
                    </p>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-3">
                    {plans.map((plan) => (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, plan: plan.id }))}
                        className={`rounded-[30px] border p-5 text-left transition ${
                          form.plan === plan.id
                            ? "border-[#ff5c00] bg-[#fff5ef] shadow-[0_18px_50px_rgba(255,92,0,0.10)]"
                            : "border-[#ecebe5] bg-[#fafaf7] hover:border-[#d7d5ce]"
                        }`}
                      >
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#84847f]">
                          {plan.name}
                        </p>
                        <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#111111]">
                          {plan.price}
                        </p>
                        <p className="mt-3 text-sm leading-7 text-[#5f5f5a]">
                          {plan.description}
                        </p>
                        <div className="mt-4 space-y-2">
                          {plan.features.map((feature) => (
                            <div key={feature} className="flex items-center gap-2 text-sm text-[#30302d]">
                              <CheckCircle2 className="size-4 text-[#17803d]" />
                              {feature}
                            </div>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7a74]">
                      Acesso inicial
                    </p>
                    <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em]">
                      Crie o administrador da empresa.
                    </h1>
                    <p className="mt-4 max-w-2xl text-base leading-8 text-[#5f5f5a]">
                      Esse será o primeiro acesso para entrar no painel, cadastrar alunos e depois liberar os usuários derivados desses alunos.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Nome do administrador" value={form.adminName} onChange={(value) => setForm((prev) => ({ ...prev, adminName: value }))} placeholder="Caique Alves" />
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#30302d]">
                        Login do administrador
                      </label>
                      <div className="flex min-h-12 items-center rounded-2xl border border-[#e6e1db] bg-white px-4">
                        <input
                          value={form.adminLogin}
                          onChange={(e) => setForm((prev) => ({ ...prev, adminLogin: e.target.value }))}
                          placeholder="caique.alves"
                          className="h-12 flex-1 bg-transparent text-sm outline-none"
                        />
                        {(domainState?.normalizedDomain || form.domain) && (
                          <span className="pl-3 text-sm text-[#7a7068]">
                            @{domainState?.normalizedDomain ?? form.domain.replace(/^@+/, "")}
                          </span>
                        )}
                      </div>
                    </div>
                    <Field label="Senha" type="password" value={form.password} onChange={(value) => setForm((prev) => ({ ...prev, password: value }))} placeholder="Mínimo de 6 caracteres" />
                    <Field label="Confirmar senha" type="password" value={form.confirmPassword} onChange={(value) => setForm((prev) => ({ ...prev, confirmPassword: value }))} placeholder="Repita a senha" />
                  </div>

                  <div className="rounded-[28px] border border-[#ecebe5] bg-[#fafaf7] p-5">
                    <p className="text-sm font-semibold text-[#111111]">Acesso que será criado</p>
                    <p className="mt-2 break-all text-base font-semibold text-[#111111]">
                      {adminEmailPreview || "Defina o login do administrador"}
                    </p>
                    <p className="mt-2 text-sm text-[#5f5f5a]">
                      Depois de entrar, você poderá cadastrar alunos com o domínio da empresa e criar usuários de aluno a partir desses cadastros.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-col gap-3 border-t border-black/6 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-[#666661]">
                Etapa {currentStep} de {steps.length}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                {currentStep > 1 && currentStep < 4 && (
                  <Button type="button" variant="outline" onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))} className="h-12 rounded-2xl px-5">
                    Voltar
                  </Button>
                )}

                {currentStep < 4 ? (
                  <Button type="button" onClick={() => void handleNextStep()} className="h-12 rounded-2xl bg-[#ff5c00] px-5 text-white hover:bg-[#eb5600]">
                    Continuar
                    <ChevronRight className="size-4" />
                  </Button>
                ) : (
                  <Button type="button" onClick={() => void handleSubmit()} disabled={submitting} className="h-12 rounded-2xl bg-[#ff5c00] px-5 text-white hover:bg-[#eb5600]">
                    {submitting ? "Concluindo..." : "Concluir cadastro"}
                    <ArrowRight className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          </section>

          <aside className="space-y-5">
            <Card className="rounded-[36px] border-white/80 bg-white/80 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-semibold tracking-[-0.04em] text-[#111111]">
                  Resumo da implantação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-[#5f5f5a]">
                <SummaryRow label="Empresa" value={form.companyName || "A definir"} />
                <SummaryRow label="Domínio" value={domainState?.normalizedDomain || form.domain || "A definir"} />
                <SummaryRow label="Plano" value={selectedPlan.name} />
                <SummaryRow label="Admin inicial" value={adminEmailPreview || "A definir"} />
              </CardContent>
            </Card>

            <Card className="rounded-[36px] border-white/80 bg-[linear-gradient(180deg,rgba(255,245,238,0.96),rgba(255,255,255,0.88))] shadow-[0_24px_70px_rgba(255,92,0,0.10)]">
              <CardContent className="space-y-4 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a05722]">
                  Como vai funcionar depois
                </p>
                <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[#111111]">
                  Alunos e usuários ficam no mesmo trilho.
                </h2>
                <p className="text-sm leading-7 text-[#6a574b]">
                  O domínio escolhido aqui passa a ser a identidade da empresa. No painel,
                  você cadastra o aluno primeiro com esse domínio e depois libera o usuário do aluno a partir desse cadastro.
                </p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-[#30302d]">{label}</label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-12 rounded-2xl border-[#e6e1db] bg-white px-4"
      />
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#f0efe9] bg-[#fafaf7] px-4 py-3">
      <span className="text-[#7a7a74]">{label}</span>
      <span className="break-all text-right font-medium text-[#111111]">{value}</span>
    </div>
  );
}
