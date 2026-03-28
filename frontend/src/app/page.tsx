import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bus,
  Compass,
  ShieldCheck,
  Sparkles,
  Waves,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RevealSection } from "@/components/marketing/RevealSection";

const highlights = [
  {
    title: "Operação em tempo real",
    description:
      "Veja ônibus, alunos e dispositivos com uma experiência clara, rápida e preparada para monitoramento ao vivo.",
    icon: Compass,
  },
  {
    title: "Gestão sem fricção",
    description:
      "Cadastre, edite e acompanhe tudo em poucos passos, com fluxos visuais consistentes e linguagem simples.",
    icon: Sparkles,
  },
  {
    title: "Segurança de ponta a ponta",
    description:
      "Controle de acesso, sessão autenticada e rastreabilidade para a operação funcionar com confiança.",
    icon: ShieldCheck,
  },
];

const stats = [
  { value: "Ao vivo", label: "Monitoramento contínuo" },
  { value: "UniHub", label: "Integração com hardware" },
  { value: "RFID", label: "Identificação inteligente" },
];

const steps = [
  {
    value: "item-1",
    title: "1. Cadastre a operação",
    content:
      "Estruture ônibus, alunos, usuários e dispositivos em um painel único. O UniPass organiza a base operacional para o dia a dia começar sem ruído.",
  },
  {
    value: "item-2",
    title: "2. Pareie o UniHub",
    content:
      "Vincule o hardware ao ônibus e habilite leitura, presença e localização. A plataforma prepara o fluxo para receber telemetria contínua.",
  },
  {
    value: "item-3",
    title: "3. Acompanhe em tempo real",
    content:
      "Visualize status, rota recente, leitura de RFID e posição no mapa com uma experiência pensada para coordenação e tomada de decisão.",
  },
];

const partners = [
  "Instituições e empresas",
  "Frotas Escolares",
  "Operadores de Transporte",
  "Municípios",
  "Empresas de Tecnologia",
];

const testimonials = [
  {
    quote:
      "O UniPass trouxe clareza para a operação. Hoje a equipe sabe exatamente onde olhar e o que fazer.",
    name: "Maria Clara",
    role: "Coordenação de Transporte Escolar",
  },
  {
    quote:
      "A experiência é rápida, bonita e prática. Parece uma plataforma feita para quem realmente vive a operação.",
    name: "Rafael Moreira",
    role: "Gestor de Frota",
  },
  {
    quote:
      "A integração entre dashboard, RFID e localização elevou muito a percepção de controle e segurança.",
    name: "Diego Almeida",
    role: "Direção Administrativa",
  },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#fbfbfd_0%,#f5f5f7_34%,#f8f8fa_70%,#ffffff_100%)] text-[#111111]">
      <div className="pointer-events-none absolute inset-0">
        <div className="unipass-glow-drift absolute left-1/2 top-[-18rem] h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-white/90 blur-3xl" />
        <div className="unipass-float-slow absolute right-[-10rem] top-28 h-[28rem] w-[28rem] rounded-full bg-[#e7eefc]/52 blur-3xl" />
        <div className="unipass-float-medium absolute bottom-[-12rem] left-[-8rem] h-[24rem] w-[24rem] rounded-full bg-[#ffe6d2]/48 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.97),transparent_40%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.28),transparent_24%,rgba(255,255,255,0.38)_100%)]" />
      </div>

      <section className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 pb-16 pt-6 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between rounded-full border border-white/70 bg-white/55 px-5 py-3 shadow-[0_10px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-11 items-center">
              <Image
                src="/logo_unipass.svg"
                alt="UniPass"
                width={126}
                height={34}
                className="h-8 w-auto"
                priority
              />
            </div>
            <div className="hidden sm:block">
              <p className="text-xs text-[#5b5b57]">
                Mobilidade inteligente em tempo real
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-medium text-[#3b3b37] transition hover:bg-white/80"
            >
              Entrar
            </Link>
            <Link
              href="#cadastro"
              className="inline-flex h-10 items-center justify-center rounded-full bg-[#ff5c00] px-5 text-sm font-medium text-white shadow-[0_16px_34px_rgba(255,92,0,0.24)] transition hover:bg-[#eb5600]"
            >
              Cadastre-se
            </Link>
          </div>
        </header>

        <RevealSection
          immediate
          delay={80}
          className="grid flex-1 items-center gap-10 py-14 lg:grid-cols-[1.15fr_0.85fr] lg:py-20"
        >
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/65 px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-[#6a6a66] shadow-[0_12px_30px_rgba(15,23,42,0.05)] backdrop-blur-xl">
              <Waves className="size-3.5 text-[#ff5c00]" />
              Plataforma para operações modernas
            </div>

            <h1 className="mt-7 max-w-4xl text-5xl font-semibold tracking-[-0.06em] text-[#111111] sm:text-6xl lg:text-7xl">
              O jeito mais elegante de gerenciar mobilidade e operação.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#575752] sm:text-xl">
              Cadastros, rastreamento, RFID, UniHub e localização em tempo real
              reunidos em uma experiência visual limpa, rápida e pensada para
              quem opera todos os dias.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex h-13 items-center justify-center gap-2 rounded-full bg-[#ff5c00] px-6 text-sm font-semibold text-white shadow-[0_20px_44px_rgba(255,92,0,0.24)] transition hover:-translate-y-0.5 hover:bg-[#eb5600]"
              >
                Entrar no UniPass
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="#cadastro"
                className="inline-flex h-13 items-center justify-center rounded-full border border-white/80 bg-white/70 px-6 text-sm font-semibold text-[#1f1f1c] shadow-[0_14px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white"
              >
                Cadastre-se para novidades
              </Link>
            </div>

            <div className="mt-10 grid max-w-2xl gap-3 sm:grid-cols-3">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[28px] border border-white/70 bg-white/60 px-5 py-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)] backdrop-blur-xl"
                >
                  <p className="text-2xl font-semibold tracking-[-0.05em] text-[#111111]">
                    {item.value}
                  </p>
                  <p className="mt-1 text-sm text-[#666661]">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="unipass-float-slow absolute inset-x-10 top-8 h-32 rounded-full bg-[#ff8b38]/16 blur-3xl" />
            <div className="unipass-float-medium relative overflow-hidden rounded-[40px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(246,247,250,0.88))] p-4 shadow-[0_30px_100px_rgba(15,23,42,0.10)] backdrop-blur-2xl">
              <div className="rounded-[32px] border border-black/5 bg-[#f8f8f5] p-4 shadow-inner shadow-white/70">
                <div className="flex items-center justify-between rounded-[26px] border border-white/80 bg-white/80 px-4 py-3 backdrop-blur-xl">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#84847f]">
                      Localização
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#111111]">
                      Ônibus monitorado em tempo real
                    </p>
                  </div>
                  <div className="rounded-full bg-[#eaf8ef] px-3 py-1 text-xs font-semibold text-[#17803d]">
                    Ao vivo
                  </div>
                </div>

                <div className="mt-4 overflow-hidden rounded-[30px] border border-white/80 bg-[linear-gradient(160deg,#f2f3ef_0%,#e6eaef_100%)] p-3">
                  <div className="relative h-[360px] overflow-hidden rounded-[24px] bg-[radial-gradient(circle_at_top,#ffffff,transparent_28%),linear-gradient(180deg,#dfe6eb_0%,#eef2ed_100%)]">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.45)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.42)_1px,transparent_1px)] bg-[size:42px_42px] opacity-40" />
                    <div className="absolute left-[12%] top-[24%] h-24 w-24 rounded-full border border-white/50 bg-white/30 blur-sm" />
                    <div className="absolute right-[8%] top-[18%] h-32 w-32 rounded-full border border-white/50 bg-white/25 blur-sm" />
                    <div className="absolute left-[14%] top-[62%] h-2 w-[42%] rounded-full bg-white/70" />
                    <div className="absolute left-[42%] top-[30%] h-[42%] w-2 rounded-full bg-white/70" />
                    <div className="absolute left-[42%] top-[30%] h-2 w-[34%] rounded-full bg-white/70" />
                    <div className="absolute right-[22%] top-[30%] h-[36%] w-2 rounded-full bg-white/70" />
                    <div className="absolute left-[18%] top-[66%] h-2 w-[58%] rounded-full bg-[#ffcfaa]" />
                    <div className="absolute left-[39%] top-[53%] h-28 w-28 rounded-full bg-[#ff8b38]/18 blur-2xl" />
                    <div className="absolute left-[47%] top-[48%]">
                      <div className="absolute inset-[-22px] rounded-full bg-[#ff5c00]/18 animate-ping" />
                      <div className="unipass-float-slow relative flex size-14 items-center justify-center rounded-full bg-[#ff5c00] text-white shadow-[0_18px_40px_rgba(255,92,0,0.24)]">
                        <Compass className="size-6 rotate-45 text-white" />
                      </div>
                    </div>
                    <div className="absolute left-5 top-5 rounded-2xl bg-white/86 px-3 py-2 text-xs font-medium text-[#4e4e49] shadow-sm backdrop-blur-xl">
                      Campus Centro
                    </div>
                    <div className="absolute bottom-5 right-5 rounded-2xl bg-white/86 px-3 py-2 text-xs font-medium text-[#4e4e49] shadow-sm backdrop-blur-xl">
                      Destino atual
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <MetricCard label="Velocidade" value="32 km/h" />
                  <MetricCard label="Última leitura" value="Agora" />
                  <MetricCard label="UniHub" value="Conectado" />
                </div>
              </div>
            </div>
          </div>
        </RevealSection>

        <RevealSection delay={40} className="grid gap-4 pb-10 lg:grid-cols-3">
          {highlights.map(({ title, description, icon: Icon }) => (
            <article
              key={title}
              className="rounded-[32px] border border-white/75 bg-white/62 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)] backdrop-blur-xl"
            >
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[#f4f4f1] text-[#ff5c00] shadow-inner shadow-white">
                <Icon className="size-5" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-[#111111]">
                {title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-[#62625d]">
                {description}
              </p>
            </article>
          ))}
        </RevealSection>

        <RevealSection
          delay={60}
          className="grid gap-6 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start"
        >
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/75 bg-white/65 px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-[#6c6c67] shadow-[0_12px_30px_rgba(15,23,42,0.04)] backdrop-blur-xl">
              <Sparkles className="size-3.5 text-[#ff5c00]" />
              Como funciona
            </div>
            <h2 className="mt-6 text-4xl font-semibold tracking-[-0.05em] text-[#111111]">
              Um fluxo simples para uma operação complexa.
            </h2>
            <p className="mt-4 text-base leading-8 text-[#5f5f5a]">
              O UniPass conecta gestão, hardware e monitoramento em uma jornada
              clara. Cada etapa foi desenhada para reduzir atrito e aumentar a
              confiança da equipe.
            </p>
          </div>

          <div className="rounded-[34px] border border-white/75 bg-white/64 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)] backdrop-blur-xl">
            <Accordion defaultValue="item-1" className="gap-2">
              {steps.map((step) => (
                <AccordionItem
                  key={step.value}
                  value={step.value}
                  className="rounded-[22px] border border-transparent px-4 transition hover:border-black/5 hover:bg-white/65"
                >
                  <AccordionTrigger className="py-5 text-base font-semibold text-[#111111] no-underline hover:no-underline">
                    {step.title}
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 text-sm leading-7 text-[#62625d]">
                    {step.content}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </RevealSection>

        <RevealSection delay={70} className="py-10">
          <div className="rounded-[34px] border border-white/75 bg-white/64 px-6 py-8 shadow-[0_24px_60px_rgba(15,23,42,0.05)] backdrop-blur-xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7a74]">
                  Parceiros e operação
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#111111]">
                  Feito para ecossistemas que precisam de precisão.
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-[#63635e]">
                Uma linguagem visual premium para quem precisa coordenar frota,
                dispositivos, equipes e informação crítica em um só ambiente.
              </p>
            </div>

            <div className="mt-8 grid gap-3 md:grid-cols-5">
              {partners.map((partner) => (
                <div
                  key={partner}
                  className="flex min-h-24 items-center justify-center rounded-[24px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(248,248,245,0.72))] px-4 text-center text-sm font-semibold text-[#3d3d39] shadow-sm"
                >
                  {partner}
                </div>
              ))}
            </div>
          </div>
        </RevealSection>

        <RevealSection delay={80} className="py-10">
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7a74]">
              Depoimentos
            </p>
            <h2 className="text-4xl font-semibold tracking-[-0.05em] text-[#111111]">
              Uma plataforma que transmite calma para a operação.
            </h2>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {testimonials.map((item) => (
              <article
                key={item.name}
                className="rounded-[32px] border border-white/75 bg-white/66 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)] backdrop-blur-xl"
              >
                <p className="text-lg leading-8 tracking-[-0.02em] text-[#232320]">
                  &ldquo;{item.quote}&rdquo;
                </p>
                <div className="mt-8 border-t border-black/6 pt-5">
                  <p className="text-sm font-semibold text-[#111111]">
                    {item.name}
                  </p>
                  <p className="mt-1 text-sm text-[#676762]">{item.role}</p>
                </div>
              </article>
            ))}
          </div>
        </RevealSection>

        <RevealSection delay={90} className="py-10">
          <div
            id="cadastro"
            className="rounded-[38px] border border-[#ffd7bf] bg-[linear-gradient(180deg,rgba(255,247,240,0.96),rgba(255,255,255,0.88))] px-6 py-8 shadow-[0_28px_70px_rgba(255,92,0,0.10)] backdrop-blur-2xl"
          >
            <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr] lg:items-center">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#ffd8c1] bg-white/80 px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-[#7a675b]">
                  <Bus className="size-3.5 text-[#ff5c00]" />
                  Cadastro antecipado
                </div>
                <h2 className="mt-6 text-4xl font-semibold tracking-[-0.05em] text-[#111111]">
                  Cadastre-se para acompanhar o próximo lançamento do UniPass.
                </h2>
                <p className="mt-4 text-base leading-8 text-[#65584e]">
                  Nosso próximo passo será abrir o fluxo de cadastro e entrada
                  institucional. Deixe seu contato para acompanhar as novidades,
                  testes e primeiras liberações.
                </p>
              </div>

              <Card className="rounded-[32px] border-0 bg-white/82 py-0 shadow-[0_22px_60px_rgba(15,23,42,0.08)] ring-1 ring-white/80">
                <CardHeader className="px-6 pt-6">
                  <CardTitle className="text-2xl font-semibold tracking-[-0.04em] text-[#111111]">
                    Lista de interesse
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 px-6 pb-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#30302d]">
                      Seu melhor e-mail
                    </label>
                    <Input
                      type="email"
                      placeholder="voce@instituicao.com.br"
                      className="h-12 rounded-2xl border-[#e8ddd6] bg-[#fffdfb] px-4 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#30302d]">
                      Instituição ou operação
                    </label>
                    <Input
                      type="text"
                      placeholder="Nome da operação, frota ou empresa"
                      className="h-12 rounded-2xl border-[#e8ddd6] bg-[#fffdfb] px-4 text-sm"
                    />
                  </div>
                  <Button className="h-12 w-full rounded-2xl bg-[#ff5c00] text-white shadow-[0_14px_30px_rgba(255,92,0,0.22)] hover:bg-[#eb5600]">
                    Quero acompanhar o lançamento
                  </Button>
                  <p className="text-xs leading-6 text-[#7a7068]">
                    Esta seção já prepara a próxima etapa do projeto. No próximo
                    passo, podemos conectar esse cadastro a um fluxo real.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </RevealSection>

        <RevealSection delay={100} className="mt-8">
          <footer className="rounded-[38px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(244,244,241,0.74))] px-6 py-8 shadow-[0_28px_70px_rgba(15,23,42,0.07)] backdrop-blur-2xl">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto_auto] lg:items-end">
              <div className="max-w-2xl">
                <div className="flex items-center gap-3">
                  <Image
                    src="/logo_unipass.svg"
                    alt="UniPass"
                    width={132}
                    height={36}
                    className="h-8 w-auto"
                  />
                </div>

                <p className="mt-5 max-w-xl text-sm leading-7 text-[#62625d]">
                  Uma experiência digital mais limpa, segura e confiável para
                  operadores, empresas e equipes que precisam enxergar a
                  operação com clareza.
                </p>
              </div>

              <div className="space-y-2 text-sm text-[#4f4f4a]">
                <p className="font-semibold text-[#111111]">Acesso rápido</p>
                <Link
                  href="/login"
                  className="block transition hover:text-black"
                >
                  Login
                </Link>
                <Link
                  href="/dashboard"
                  className="block transition hover:text-black"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/location"
                  className="block transition hover:text-black"
                >
                  Localização
                </Link>
              </div>

              <div className="space-y-2 text-sm text-[#4f4f4a]">
                <p className="font-semibold text-[#111111]">Contato</p>
                <p>caique7k@gmail.com.br</p>
                <p>+55 17 98810-3154</p>
                <p>Brasil</p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 border-t border-black/6 pt-5 text-xs uppercase tracking-[0.16em] text-[#84847f] sm:flex-row sm:items-center sm:justify-between">
              <p>© 2026 UniPass. Todos os direitos reservados.</p>
              <p>Mobilidade conectada com tecnologia e confiança.</p>
            </div>
          </footer>
        </RevealSection>
      </section>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-white/80 bg-white/75 px-4 py-4 shadow-sm backdrop-blur-xl">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8b8b85]">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold tracking-[-0.04em] text-[#111111]">
        {value}
      </p>
    </div>
  );
}
