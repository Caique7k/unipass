"use client";

import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/app/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { api } from "@/services/api";

const REMEMBER_STORAGE_KEY = "unipass-remember-me";

const showcaseSlides = [
  {
    src: "/unipass/unipass-dashboard.png",
    alt: "Dashboard principal do UniPass",
    eyebrow: "Painel central",
    title: "Visao clara da operacao.",
    badge: "Ao vivo",
  },
  {
    src: "/unipass/unipass-student.png",
    alt: "Tela de acompanhamento de alunos no UniPass",
    eyebrow: "Gestao de alunos",
    title: "Cadastros mais organizados.",
    badge: "Fluxo rapido",
  },
  {
    src: "/unipass/unipass-bus.png",
    alt: "Tela de acompanhamento da frota no UniPass",
    eyebrow: "Monitoramento de frota",
    title: "Frota e telemetria no mesmo lugar.",
    badge: "Visao completa",
  },
];

const quickHighlights = ["Tempo real", "RFID + GPS", "Acesso seguro"];

function delayStyle(delay: number): CSSProperties {
  return { "--login-delay": `${delay}ms` } as CSSProperties;
}

export default function LoginPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [activeSlide, setActiveSlide] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorModal, setErrorModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedValue = window.localStorage.getItem(REMEMBER_STORAGE_KEY);
    setRememberMe(savedValue === "true");
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % showcaseSlides.length);
    }, 5200);

    return () => window.clearInterval(intervalId);
  }, []);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Informe seu e-mail para entrar.");
      return;
    }

    if (!password.trim()) {
      toast.error("Informe sua senha para entrar.");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        email: email.trim(),
        password,
        ...(rememberMe ? { rememberMe: true } : {}),
      };

      try {
        await api.post("/auth/login", payload);
      } catch (error) {
        const message = axios.isAxiosError(error)
          ? error.response?.data?.message
          : null;

        const unknownRememberField =
          error &&
          axios.isAxiosError(error) &&
          error.response?.status === 400 &&
          ((Array.isArray(message) &&
            message.some(
              (item) => typeof item === "string" && item.includes("rememberMe"),
            )) ||
            (typeof message === "string" && message.includes("rememberMe")));

        if (!unknownRememberField) {
          throw error;
        }

        await api.post("/auth/login", {
          email: email.trim(),
          password,
        });
        toast.warning(
          "O backend ainda nao aplicou 'Manter conectado'. Entrando sem persistencia.",
        );
      }

      window.localStorage.setItem(REMEMBER_STORAGE_KEY, String(rememberMe));
      toast.success("Login realizado com sucesso.");
      await refreshUser();
      router.push("/dashboard");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast.error("E-mail ou senha invalidos.");
      } else {
        const message = axios.isAxiosError(error)
          ? error.response?.data?.message
          : null;

        if (Array.isArray(message) && typeof message[0] === "string") {
          toast.error(message[0]);
        } else if (typeof message === "string") {
          toast.error(message);
        } else {
          toast.error("Nao foi possivel entrar agora.");
        }
      }

      setErrorModal(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#fcfaf7_0%,#f7f4ef_30%,#eef3f8_100%)] text-[#111827]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="login-breath-slow absolute left-[-8rem] top-[10%] h-[22rem] w-[22rem] rounded-full bg-[#ff7a1a]/18 blur-3xl" />
        <div className="login-breath absolute right-[-6rem] top-[-2rem] h-[18rem] w-[18rem] rounded-full bg-[#0f6aad]/16 blur-3xl" />
        <div className="login-breath-fast absolute bottom-[-10rem] left-[18%] h-[24rem] w-[24rem] rounded-full bg-[#ff5c00]/14 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.98),transparent_42%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.6),transparent_32%,rgba(255,255,255,0.38)_100%)]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <div className="grid w-full gap-5 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-center xl:gap-6">
          <section className="order-2 hidden xl:block xl:order-1">
            <div className="mx-auto max-w-3xl xl:mx-0 xl:max-w-none">
              <div className="login-intro inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/76 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5d5b56] shadow-[0_12px_30px_rgba(15,23,42,0.05)] backdrop-blur-xl">
                <Sparkles className="size-3.5 text-[#ff5c00]" />
                Plataforma UniPass
              </div>

              <div className="login-intro mt-5 max-w-2xl" style={delayStyle(80)}>
                <h1 className="max-w-2xl text-4xl font-semibold tracking-[-0.06em] text-[#0f172a]">
                  Entrar no UniPass
                </h1>
                <p className="mt-3 max-w-xl text-base leading-7 text-[#475569]">
                  Acesso simples, claro e consistente com o restante da plataforma.
                </p>
              </div>

              <div
                className="login-intro mt-4 flex flex-wrap gap-2"
                style={delayStyle(130)}
              >
                {quickHighlights.map((highlight) => (
                  <div
                    key={highlight}
                    className="rounded-full border border-white/80 bg-white/74 px-4 py-2 text-sm font-semibold text-[#334155] shadow-[0_12px_28px_rgba(15,23,42,0.05)] backdrop-blur-xl"
                  >
                    {highlight}
                  </div>
                ))}
              </div>

              <div
                className="login-intro mt-5 overflow-hidden rounded-[34px] border border-white/85 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(247,248,251,0.82))] p-4 shadow-[0_28px_70px_rgba(15,23,42,0.1)] backdrop-blur-2xl"
                style={delayStyle(170)}
              >
                <div className="rounded-[28px] border border-black/5 bg-[#f8f7f3] p-3 shadow-inner shadow-white/80">
                  <div className="flex items-center justify-between gap-3 px-1 pb-3">
                    <div className="flex items-center gap-2 px-1 pb-3">
                      <span className="size-2.5 rounded-full bg-[#ff7a1a]" />
                      <span className="size-2.5 rounded-full bg-[#ffb36d]" />
                      <span className="size-2.5 rounded-full bg-[#c7d6e8]" />
                    </div>
                    <Link
                      href="/cadastro/empresa"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-[#ff5c00] transition hover:text-[#da4d00]"
                    >
                      Cadastrar empresa
                      <ArrowRight className="size-4" />
                    </Link>
                  </div>

                  <div className="relative overflow-hidden rounded-[22px] border border-white/80 bg-[#eef2f7]">
                    <div className="relative aspect-[16/10] min-h-[220px]">
                      {showcaseSlides.map((slide, index) => (
                        <figure
                          key={slide.src}
                          className={cn(
                            "absolute inset-0 transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                            index === activeSlide
                              ? "z-20 scale-100 opacity-100"
                              : "z-10 scale-[1.03] opacity-0",
                          )}
                        >
                          <Image
                            src={slide.src}
                            alt={slide.alt}
                            fill
                            priority={index === 0}
                            sizes="(min-width: 1280px) 42vw, (min-width: 768px) 70vw, 92vw"
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,10,18,0.02),rgba(7,10,18,0.42))]" />
                        </figure>
                      ))}

                      <div className="absolute inset-x-4 bottom-4 rounded-[22px] border border-white/20 bg-[#09111d]/72 p-4 text-white shadow-[0_18px_40px_rgba(9,17,29,0.28)] backdrop-blur-xl">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/74">
                            {showcaseSlides[activeSlide].eyebrow}
                          </p>
                          <span className="rounded-full bg-[#ff5c00] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                            {showcaseSlides[activeSlide].badge}
                          </span>
                        </div>
                        <h2 className="mt-3 max-w-lg text-xl font-semibold tracking-[-0.05em] text-white">
                          {showcaseSlides[activeSlide].title}
                        </h2>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    {showcaseSlides.map((slide, index) => (
                      <button
                        key={slide.src}
                        type="button"
                        aria-label={`Exibir imagem ${index + 1}`}
                        onClick={() => setActiveSlide(index)}
                        className={cn(
                          "h-2.5 rounded-full bg-[#cfd6de] transition-all duration-300 hover:bg-[#ff7a1a]",
                          index === activeSlide ? "w-9 bg-[#ff5c00]" : "w-2.5",
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="order-1 xl:order-2 xl:flex xl:justify-end">
            <div
              className="login-intro mx-auto w-full max-w-[26rem] xl:mx-0"
              style={delayStyle(160)}
            >
              <div className="rounded-[32px] border border-white/85 bg-white/90 px-5 py-5 shadow-[0_28px_80px_rgba(15,23,42,0.12)] backdrop-blur-2xl sm:px-6 sm:py-6">
                <div className="flex items-start justify-between gap-4">
                  <Link href="/" className="inline-flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-[#f0dfd2] bg-[linear-gradient(180deg,#fff8f2_0%,#fff1e6_100%)] shadow-[0_14px_30px_rgba(255,92,0,0.12)]">
                      <Image
                        src="/logo_unipass.svg"
                        alt="UniPass"
                        width={34}
                        height={34}
                        priority
                        className="h-auto w-9"
                      />
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7c7368]">
                        Acesso UniPass
                      </p>
                      <p className="mt-1 text-sm font-medium text-[#334155]">
                        Painel corporativo
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/"
                    className="inline-flex items-center rounded-full border border-[#eedfd0] bg-[#fff8f1] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#b45309] transition hover:bg-white"
                  >
                    Voltar
                  </Link>
                </div>

                <div className="mt-5 rounded-[24px] border border-[#f2e6da] bg-[linear-gradient(180deg,#fffaf5_0%,#fff3ea_100%)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a5b1f]">
                    Entrar no painel
                  </p>
                  <h2 className="mt-2 text-[1.75rem] font-semibold tracking-[-0.05em] text-[#111827]">
                    Acesse sua conta
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#5b6472]">
                    Entre com seu e-mail corporativo.
                  </p>
                </div>

                <form onSubmit={handleLogin} className="mt-5 space-y-3.5">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#111827]">
                      E-mail
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#7c8899]" />
                      <Input
                        type="email"
                        placeholder="voce@empresa.com"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-13 rounded-2xl border-[#d9cdbf] bg-[#fffdfa] pl-11 pr-4 text-[#0f172a] shadow-none placeholder:text-[#94a3b8] focus-visible:border-[#ff5c00] focus-visible:ring-[#ff5c00]/15 dark:border-[#d9cdbf] dark:bg-[#fffdfa] dark:text-[#0f172a] dark:placeholder:text-[#94a3b8]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#111827]">
                      Senha
                    </label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#7c8899]" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Digite sua senha"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-13 rounded-2xl border-[#d9cdbf] bg-[#fffdfa] pl-11 pr-12 text-[#0f172a] shadow-none placeholder:text-[#94a3b8] focus-visible:border-[#ff5c00] focus-visible:ring-[#ff5c00]/15 dark:border-[#d9cdbf] dark:bg-[#fffdfa] dark:text-[#0f172a] dark:placeholder:text-[#94a3b8]"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                        className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-[#7c8899] transition hover:text-[#334155]"
                      >
                        {showPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[#ecdfd2] bg-[#fff8f2] px-4 py-3 transition-colors hover:bg-white">
                    <Checkbox
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
                      className="size-[18px] border-[#d9c2ad] bg-white text-white data-checked:border-[#ff5c00] data-checked:bg-[#ff5c00] dark:border-[#d9c2ad] dark:bg-white dark:data-checked:border-[#ff5c00] dark:data-checked:bg-[#ff5c00]"
                    />
                    <span className="text-sm font-medium text-[#374151]">
                      Manter conectado neste dispositivo
                    </span>
                  </label>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-13 w-full rounded-2xl bg-[linear-gradient(135deg,#ff5c00_0%,#ff7a1a_100%)] text-sm font-semibold text-white shadow-[0_20px_40px_rgba(255,92,0,0.28)] transition-transform hover:-translate-y-0.5 hover:opacity-95 dark:text-white"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Entrando...
                      </span>
                    ) : (
                      "Entrar"
                    )}
                  </Button>
                </form>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <p className="text-[#526071]">Primeiro acesso?</p>
                  <Link
                    href="/cadastro/empresa"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#0f6aad] transition hover:text-[#0a4f82]"
                  >
                    Criar cadastro
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {errorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 animate-[fadeIn_0.2s_ease] bg-[#09111d]/42 backdrop-blur-sm"
            onClick={() => setErrorModal(false)}
          />

          <div className="relative w-full max-w-sm animate-[scaleIn_0.28s_cubic-bezier(0.22,1,0.36,1)] rounded-[30px] border border-white/80 bg-[linear-gradient(180deg,#ffffff_0%,#fff7f2_100%)] p-6 shadow-[0_30px_90px_rgba(15,23,42,0.18)]">
            <button
              onClick={() => setErrorModal(false)}
              className="absolute right-4 top-4 cursor-pointer text-[#7c8899] transition hover:text-[#334155]"
            >
              <X className="size-4" />
            </button>

            <div className="flex size-12 items-center justify-center rounded-2xl bg-[#fff1e8] text-[#ff5c00] shadow-inner shadow-white">
              <Lock className="size-5" />
            </div>

            <h3 className="mt-5 text-xl font-semibold tracking-[-0.04em] text-[#111827]">
              Login invalido
            </h3>

            <p className="mt-2 text-sm leading-6 text-[#5b6472]">
              O e-mail ou a senha informados estao incorretos.
            </p>

            <Button
              onClick={() => setErrorModal(false)}
              className="mt-6 h-11 w-full rounded-2xl bg-[linear-gradient(135deg,#ff5c00_0%,#ff7a1a_100%)] text-white hover:opacity-95 dark:text-white"
            >
              Tentar novamente
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
