"use client";

import axios from "axios";
import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type MouseEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, ShieldCheck, Waves, X } from "lucide-react";
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
    alt: "Visao geral do dashboard UniPass",
    eyebrow: "Painel inteligente",
    title: "A operacao inteira organizada em uma experiencia clara.",
  },
  {
    src: "/unipass/unipass-student.png",
    alt: "Jornada do aluno na plataforma UniPass",
    eyebrow: "Jornada do aluno",
    title: "Cadastro, acompanhamento e presenca conectados em um fluxo unico.",
  },
  {
    src: "/unipass/unipass-bus.png",
    alt: "Monitoramento de frota na plataforma UniPass",
    eyebrow: "Frota conectada",
    title: "Onibus, telemetria e localizacao caminhando no mesmo ritmo.",
  },
];

const floatingBadges = [
  {
    title: "RFID integrado",
    description: "Leituras e presenca sincronizadas.",
    icon: ShieldCheck,
    className: "left-0 top-16 hidden md:block lg:left-2 lg:top-20",
    delay: 220,
  },
  {
    title: "Ao vivo",
    description: "Localizacao e operacao em tempo real.",
    icon: Waves,
    className: "right-0 top-8 hidden md:block lg:right-4 lg:top-14",
    delay: 280,
  },
];

function delayStyle(delay: number): CSSProperties {
  return { "--login-delay": `${delay}ms` } as CSSProperties;
}

function getSlideState(index: number, activeIndex: number, total: number) {
  const offset = (index - activeIndex + total) % total;

  if (offset === 0) {
    return "active";
  }

  if (offset === 1) {
    return "next";
  }

  return "previous";
}

export default function LoginPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const sceneRef = useRef<HTMLDivElement>(null);

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
    }, 4200);

    return () => window.clearInterval(intervalId);
  }, []);

  function updatePointer(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;

    sceneRef.current?.style.setProperty("--login-pointer-x", x.toFixed(3));
    sceneRef.current?.style.setProperty("--login-pointer-y", y.toFixed(3));
  }

  function resetPointer() {
    sceneRef.current?.style.setProperty("--login-pointer-x", "0");
    sceneRef.current?.style.setProperty("--login-pointer-y", "0");
  }

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
    <div
      ref={sceneRef}
      onMouseMove={updatePointer}
      onMouseLeave={resetPointer}
      className="login-canvas group/login relative min-h-screen overflow-hidden bg-[#f5f5f2] text-[#111827] dark:bg-[#f5f5f2] dark:text-[#111827]"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-36rem] top-1/2 -translate-y-1/2">
          <div
            className="login-intro h-[78rem] w-[78rem] rounded-full bg-[radial-gradient(circle_at_63%_42%,rgba(255,255,255,0.98)_0%,rgba(255,244,236,0.98)_28%,rgba(255,190,145,0.35)_52%,rgba(255,140,69,0.14)_66%,rgba(255,140,69,0)_78%)]"
            style={delayStyle(40)}
          />
        </div>

        <div className="absolute left-[-14rem] top-1/2 -translate-y-1/2">
          <div
            className="login-intro h-[58rem] w-[58rem] rounded-full border border-white/50 bg-white/18 backdrop-blur-[3px]"
            style={delayStyle(90)}
          />
        </div>

        <div className="absolute left-[5%] top-[10%]">
          <div className="login-intro" style={delayStyle(180)}>
            <div className="login-breath-slow">
              <div className="login-parallax-soft h-24 w-24 rounded-full border border-white/55 bg-white/38 shadow-[0_18px_48px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:h-28 sm:w-28" />
            </div>
          </div>
        </div>

        <div className="absolute left-[18%] bottom-[14%]">
          <div className="login-intro" style={delayStyle(220)}>
            <div className="login-breath">
              <div className="login-parallax-reverse h-16 w-32 rounded-full border border-white/55 bg-[#fff4ec]/58 shadow-[0_18px_48px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:h-20 sm:w-40" />
            </div>
          </div>
        </div>

        <div className="absolute right-[14%] top-[14%]">
          <div className="login-intro" style={delayStyle(260)}>
            <div className="login-breath-fast">
              <div className="login-parallax-soft h-20 w-20 rounded-full border border-white/55 bg-[#eef4ff]/70 shadow-[0_18px_48px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:h-24 sm:w-24" />
            </div>
          </div>
        </div>

        <div className="absolute right-[9%] bottom-[16%]">
          <div className="login-intro" style={delayStyle(300)}>
            <div className="login-breath-slow">
              <div className="login-parallax-reverse h-20 w-36 rounded-full border border-white/55 bg-white/32 shadow-[0_18px_48px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:h-24 sm:w-44" />
            </div>
          </div>
        </div>
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1480px] items-center px-4 py-6 sm:px-6 lg:px-10">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] xl:gap-16">
          <section className="order-2 lg:order-1">
            <div className="relative min-h-[31rem] lg:min-h-[44rem]">
              <div className="login-intro max-w-[38rem]" style={delayStyle(120)}>
                <div className="login-parallax-soft inline-flex rounded-full border border-white/70 bg-white/66 px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-[#686862] shadow-[0_12px_30px_rgba(15,23,42,0.05)] backdrop-blur-xl">
                  <span className="flex items-center gap-2">
                    <Waves className="size-3.5 text-[#ff5c00]" />
                    Mobilidade conectada com linguagem premium
                  </span>
                </div>

                <h1 className="mt-6 max-w-[13ch] text-4xl font-semibold tracking-[-0.06em] text-[#111827] sm:text-5xl xl:text-[4.2rem]">
                  Um login que ja coloca o UniPass em movimento.
                </h1>

                <p className="mt-5 max-w-xl text-base leading-7 text-[#5f666f] sm:text-lg sm:leading-8">
                  Mantivemos o card familiar e trouxemos para a esquerda uma
                  cena viva, com frota, operacao e transicoes suaves que
                  acompanham o estilo atual do site.
                </p>
              </div>

              <div className="relative mt-10 h-[25rem] sm:h-[30rem] lg:mt-12 lg:h-[33rem]">
                {floatingBadges.map((badge) => {
                  const Icon = badge.icon;

                  return (
                    <div
                      key={badge.title}
                      className={cn("absolute z-20", badge.className)}
                    >
                      <div
                        className="login-intro"
                        style={delayStyle(badge.delay)}
                      >
                        <div className="login-breath-slow">
                          <div className="login-parallax-reverse rounded-[28px] border border-white/75 bg-white/72 px-4 py-3 shadow-[0_18px_44px_rgba(15,23,42,0.08)] backdrop-blur-2xl transition-shadow duration-500 hover:shadow-[0_24px_54px_rgba(15,23,42,0.12)]">
                            <div className="flex items-center gap-3">
                              <div className="flex size-10 items-center justify-center rounded-2xl bg-[#fff1e8] text-[#ff5c00]">
                                <Icon className="size-4" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-[#111827]">
                                  {badge.title}
                                </p>
                                <p className="text-xs text-[#6b7280]">
                                  {badge.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="relative z-10 mx-auto w-full max-w-[34rem]">
                  <div className="login-intro" style={delayStyle(160)}>
                    <div className="login-parallax-soft">
                      <div className="relative overflow-visible rounded-full transition-transform duration-700 hover:scale-[1.01]">
                        <div className="absolute inset-3 rounded-full border border-white/50" />
                        <div className="absolute inset-0 rounded-full border border-white/55 bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(255,255,255,0.2))] shadow-[0_30px_90px_rgba(15,23,42,0.09)] backdrop-blur-2xl" />
                        <div className="login-breath-slow absolute left-[8%] top-[8%] h-[84%] w-[84%] rounded-full border border-white/50 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.96),rgba(255,255,255,0.18)_35%,rgba(255,255,255,0.04)_62%,rgba(255,255,255,0.55)_100%)]" />
                        <div className="absolute inset-[7%] overflow-hidden rounded-full border border-white/65 shadow-inner shadow-white/50">
                          {showcaseSlides.map((slide, index) => {
                            const slideState = getSlideState(
                              index,
                              activeSlide,
                              showcaseSlides.length,
                            );

                            return (
                              <figure
                                key={slide.src}
                                className={cn(
                                  "absolute inset-0 transition-all duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                                  slideState === "active" &&
                                    "z-20 translate-x-0 scale-100 opacity-100",
                                  slideState === "next" &&
                                    "z-10 translate-x-12 scale-[0.94] opacity-0",
                                  slideState === "previous" &&
                                    "z-0 -translate-x-12 scale-[0.94] opacity-0",
                                )}
                              >
                                <Image
                                  src={slide.src}
                                  alt={slide.alt}
                                  fill
                                  sizes="(min-width: 1024px) 38vw, 85vw"
                                  priority={index === 0}
                                  className="object-cover"
                                />
                                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#111827]/58 via-[#111827]/12 to-transparent" />
                                <figcaption
                                  className={cn(
                                    "absolute bottom-7 left-7 right-7 rounded-[28px] border border-white/20 bg-[#111827]/30 px-5 py-4 text-white shadow-[0_18px_44px_rgba(15,23,42,0.18)] backdrop-blur-xl transition-all duration-700 ease-out",
                                    slideState === "active"
                                      ? "translate-y-0 opacity-100"
                                      : "translate-y-4 opacity-0",
                                  )}
                                >
                                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/72">
                                    {slide.eyebrow}
                                  </p>
                                  <p className="mt-2 text-sm font-medium leading-6 text-white/96 sm:text-base">
                                    {slide.title}
                                  </p>
                                </figcaption>
                              </figure>
                            );
                          })}
                        </div>

                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="h-[108%] w-[108%] rounded-full border border-dashed border-white/30 animate-[spin_20s_linear_infinite]" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className="login-intro mt-5 flex items-center justify-center gap-2"
                    style={delayStyle(200)}
                  >
                    {showcaseSlides.map((slide, index) => (
                      <button
                        key={slide.src}
                        type="button"
                        aria-label={`Exibir ${slide.eyebrow}`}
                        onClick={() => setActiveSlide(index)}
                        className={cn(
                          "h-2.5 rounded-full bg-[#d7d1ca] transition-all duration-500 hover:bg-[#ff8a4a]",
                          index === activeSlide
                            ? "w-9 bg-[#ff5c00]"
                            : "w-2.5",
                        )}
                      />
                    ))}
                  </div>
                </div>

                <div className="absolute inset-x-0 bottom-0 z-20">
                  <div className="login-intro" style={delayStyle(260)}>
                    <div className="login-parallax-reverse">
                      <div className="relative mx-auto w-full max-w-[34rem] pb-10">
                        <div className="relative z-20 px-3 sm:px-6">
                          <div className="login-bus-shell relative mx-auto h-[11rem] w-full max-w-[28rem]">
                            <div className="login-bus-shadow" />

                            <div className="absolute inset-x-0 top-5 bottom-4 overflow-hidden rounded-[38px] border border-white/28 bg-[linear-gradient(180deg,#ff974f_0%,#ff6d12_70%,#db5200_100%)] shadow-[0_24px_50px_rgba(255,92,0,0.25)]">
                              <div className="absolute left-5 right-24 top-5 h-16 rounded-[24px] bg-[linear-gradient(180deg,#29415d_0%,#1f3349_100%)] shadow-inner shadow-white/10">
                                <div className="absolute inset-x-3 top-3 flex gap-2">
                                  {Array.from({ length: 4 }).map((_, index) => (
                                    <div
                                      key={index}
                                      className="h-10 flex-1 rounded-[14px] bg-[linear-gradient(180deg,rgba(255,255,255,0.5),rgba(157,214,255,0.22)_55%,rgba(255,255,255,0.08)_100%)]"
                                    />
                                  ))}
                                </div>
                              </div>

                              <div className="absolute right-4 top-5 h-[4.8rem] w-[4.3rem] rounded-[24px] border border-white/18 bg-[linear-gradient(180deg,#395370_0%,#24384f_100%)] shadow-inner shadow-white/8">
                                <div className="absolute inset-2 rounded-[18px] bg-[linear-gradient(180deg,rgba(255,255,255,0.42),rgba(143,197,238,0.14)_56%,rgba(255,255,255,0.08)_100%)]" />
                                <div className="absolute bottom-2 left-1/2 h-9 w-1 -translate-x-1/2 rounded-full bg-white/20" />
                              </div>

                              <div className="absolute left-8 top-4 h-3 w-28 rounded-full bg-white/22 blur-sm" />
                              <div className="absolute left-8 right-8 bottom-6 h-3 rounded-full bg-[#922e00]/26" />
                              <div className="absolute right-0 top-14 h-8 w-4 rounded-l-full bg-[#ffdca9] shadow-[0_0_16px_rgba(255,220,169,0.9)]" />
                              <div className="absolute right-0 top-12 h-12 w-6 rounded-l-[1.2rem] bg-[linear-gradient(180deg,#ff8b40_0%,#ff6510_100%)]" />
                              <div className="absolute bottom-5 left-6 h-2 w-14 rounded-full bg-white/20" />
                              <div className="absolute bottom-5 right-14 h-2 w-12 rounded-full bg-white/20" />
                            </div>

                            <div className="login-wheel absolute -bottom-1 left-10 sm:left-12" />
                            <div className="login-wheel absolute -bottom-1 right-10 sm:right-12" />
                          </div>
                        </div>

                        <div className="login-road absolute inset-x-0 bottom-0 z-10 h-[6.8rem]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="order-1 lg:order-2">
            <div className="login-intro mx-auto w-full max-w-[29.5rem] lg:ml-auto lg:mr-0" style={delayStyle(180)}>
              <div className="rounded-[34px] border border-[#e8e3db] bg-white/92 px-6 py-7 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-[18px] transition-transform duration-700 hover:-translate-y-1 sm:px-8 sm:py-9">
                <div className="flex size-14 items-center justify-center rounded-[20px] border border-[#efe7df] bg-[#faf8f5] shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                  <Image
                    src="/logo_unipass.png"
                    alt="UniPass"
                    width={28}
                    height={28}
                    priority
                    className="h-auto w-7"
                  />
                </div>

                <div className="mt-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8b8b85]">
                    Acesse sua operacao
                  </p>
                  <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#111827]">
                    Entrar no UniPass
                  </h1>
                  <p className="mt-3 text-sm leading-6 text-[#6b7280]">
                    Entre com seu e-mail corporativo para acompanhar a
                    plataforma com a mesma experiencia limpa do restante do
                    sistema.
                  </p>
                </div>

                <form onSubmit={handleLogin} className="mt-8 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#111827]">
                      E-mail
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#9ca3af]" />
                      <Input
                        type="email"
                        placeholder="voce@empresa.com"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-12 rounded-2xl border-[#ddd7cf] bg-[#fcfcfb] pl-11 pr-4 text-[#111827] shadow-none placeholder:text-[#9ca3af] focus-visible:border-[#ff5c00] focus-visible:ring-[#ff5c00]/12 dark:border-[#ddd7cf] dark:bg-[#fcfcfb] dark:text-[#111827] dark:placeholder:text-[#9ca3af]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#111827]">
                      Senha
                    </label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#9ca3af]" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Digite sua senha"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-12 rounded-2xl border-[#ddd7cf] bg-[#fcfcfb] pl-11 pr-12 text-[#111827] shadow-none placeholder:text-[#9ca3af] focus-visible:border-[#ff5c00] focus-visible:ring-[#ff5c00]/12 dark:border-[#ddd7cf] dark:bg-[#fcfcfb] dark:text-[#111827] dark:placeholder:text-[#9ca3af]"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={
                          showPassword ? "Ocultar senha" : "Mostrar senha"
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-[#9ca3af] transition hover:text-[#4b5563]"
                      >
                        {showPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[#ebe6df] bg-[#faf8f5] px-4 py-3 transition-colors hover:bg-white">
                    <Checkbox
                      checked={rememberMe}
                      onCheckedChange={(checked) =>
                        setRememberMe(Boolean(checked))
                      }
                      className="border-[#d8d2ca] bg-white text-white data-checked:border-[#ff5c00] data-checked:bg-[#ff5c00] dark:border-[#d8d2ca] dark:bg-white dark:data-checked:border-[#ff5c00] dark:data-checked:bg-[#ff5c00]"
                    />
                    <span className="text-sm font-medium text-[#374151]">
                      Manter conectado
                    </span>
                  </label>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-12 w-full rounded-2xl bg-[#ff5c00] text-sm font-semibold text-white shadow-[0_16px_32px_rgba(255,92,0,0.22)] transition-transform hover:-translate-y-0.5 hover:bg-[#eb5600] dark:bg-[#ff5c00] dark:text-white dark:hover:bg-[#eb5600]"
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
              </div>
            </div>
          </section>
        </div>
      </div>

      {errorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 animate-[fadeIn_0.2s_ease] bg-black/28 backdrop-blur-sm"
            onClick={() => setErrorModal(false)}
          />

          <div className="relative w-full max-w-sm animate-[scaleIn_0.28s_cubic-bezier(0.22,1,0.36,1)] rounded-[28px] border border-[#e8e3db] bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.16)]">
            <button
              onClick={() => setErrorModal(false)}
              className="absolute right-4 top-4 cursor-pointer text-[#9ca3af] transition hover:text-[#4b5563]"
            >
              <X className="size-4" />
            </button>

            <div className="flex size-12 items-center justify-center rounded-2xl bg-[#fff1e8] text-[#ff5c00]">
              <Lock className="size-5" />
            </div>

            <h3 className="mt-5 text-xl font-semibold tracking-[-0.04em] text-[#111827]">
              Login invalido
            </h3>

            <p className="mt-2 text-sm leading-6 text-[#6b7280]">
              O e-mail ou a senha informados estao incorretos.
            </p>

            <Button
              onClick={() => setErrorModal(false)}
              className="mt-6 h-11 w-full rounded-2xl bg-[#ff5c00] text-white hover:bg-[#eb5600] dark:bg-[#ff5c00] dark:text-white dark:hover:bg-[#eb5600]"
            >
              Tentar novamente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
