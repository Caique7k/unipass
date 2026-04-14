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
import { Eye, EyeOff, Lock, Mail, X } from "lucide-react";
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
  },
  {
    src: "/unipass/unipass-student.png",
    alt: "Jornada do aluno na plataforma UniPass",
  },
  {
    src: "/unipass/unipass-bus.png",
    alt: "Monitoramento de frota na plataforma UniPass",
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
      className="login-canvas relative min-h-screen overflow-hidden bg-[#f5f5f2] text-[#111827] dark:bg-[#f5f5f2] dark:text-[#111827] lg:h-screen"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-36rem] top-1/2 -translate-y-1/2">
          <div
            className="login-intro h-[76rem] w-[76rem] rounded-full bg-[radial-gradient(circle_at_63%_42%,rgba(255,255,255,0.98)_0%,rgba(255,244,236,0.98)_28%,rgba(255,190,145,0.35)_52%,rgba(255,140,69,0.14)_66%,rgba(255,140,69,0)_78%)]"
            style={delayStyle(40)}
          />
        </div>

        <div className="absolute left-[-12rem] top-1/2 -translate-y-1/2">
          <div
            className="login-intro h-[54rem] w-[54rem] rounded-full border border-white/50 bg-white/18 backdrop-blur-[3px]"
            style={delayStyle(90)}
          />
        </div>

        <div className="absolute left-[4%] top-[10%]">
          <div className="login-intro" style={delayStyle(180)}>
            <div className="login-breath-slow">
              <div className="login-parallax-soft h-24 w-24 rounded-full border border-white/55 bg-white/38 shadow-[0_18px_48px_rgba(15,23,42,0.08)] backdrop-blur-xl" />
            </div>
          </div>
        </div>

        <div className="absolute left-[12%] bottom-[15%]">
          <div className="login-intro" style={delayStyle(220)}>
            <div className="login-breath">
              <div className="login-parallax-reverse h-16 w-32 rounded-full border border-white/55 bg-[#fff4ec]/58 shadow-[0_18px_48px_rgba(15,23,42,0.06)] backdrop-blur-xl" />
            </div>
          </div>
        </div>

        <div className="absolute right-[14%] top-[14%]">
          <div className="login-intro" style={delayStyle(260)}>
            <div className="login-breath-fast">
              <div className="login-parallax-soft h-20 w-20 rounded-full border border-white/55 bg-[#eef4ff]/70 shadow-[0_18px_48px_rgba(15,23,42,0.06)] backdrop-blur-xl" />
            </div>
          </div>
        </div>

        <div className="absolute right-[8%] bottom-[16%]">
          <div className="login-intro" style={delayStyle(300)}>
            <div className="login-breath-slow">
              <div className="login-parallax-reverse h-20 w-36 rounded-full border border-white/55 bg-white/32 shadow-[0_18px_48px_rgba(15,23,42,0.06)] backdrop-blur-xl" />
            </div>
          </div>
        </div>
      </div>

      <div className="relative mx-auto grid min-h-screen w-full max-w-[1460px] items-center gap-6 px-4 py-4 sm:px-6 lg:h-screen lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-8 lg:px-10 lg:py-6 xl:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden h-full items-center justify-center lg:flex">
          <div className="relative h-[min(78vh,42rem)] w-full max-w-[44rem]">
            <div className="absolute left-[2%] top-[9%] z-10">
              <div className="login-intro" style={delayStyle(160)}>
                <div className="login-breath-fast">
                  <div className="login-parallax-soft h-16 w-16 rounded-full border border-white/60 bg-white/46 shadow-[0_18px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl transition-transform duration-500 hover:scale-110" />
                </div>
              </div>
            </div>

            <div className="absolute left-[7%] bottom-[26%] z-10">
              <div className="login-intro" style={delayStyle(220)}>
                <div className="login-breath">
                  <div className="login-parallax-reverse h-14 w-28 rounded-full border border-white/60 bg-[#fff3e8]/72 shadow-[0_18px_40px_rgba(15,23,42,0.05)] backdrop-blur-xl transition-transform duration-500 hover:scale-105" />
                </div>
              </div>
            </div>

            <div className="absolute right-[8%] top-[14%] z-10">
              <div className="login-intro" style={delayStyle(260)}>
                <div className="login-breath-slow">
                  <div className="login-parallax-soft h-20 w-20 rounded-full border border-white/60 bg-[#eef4ff]/74 shadow-[0_18px_40px_rgba(15,23,42,0.05)] backdrop-blur-xl transition-transform duration-500 hover:scale-110" />
                </div>
              </div>
            </div>

            <div className="absolute right-[4%] bottom-[12%] z-10">
              <div className="login-intro" style={delayStyle(300)}>
                <div className="login-breath">
                  <div className="login-parallax-reverse h-16 w-32 rounded-full border border-white/60 bg-white/38 shadow-[0_18px_40px_rgba(15,23,42,0.05)] backdrop-blur-xl transition-transform duration-500 hover:scale-105" />
                </div>
              </div>
            </div>

            <div className="absolute left-1/2 top-[44%] z-20 h-[29rem] w-[29rem] -translate-x-1/2 -translate-y-1/2">
              <div className="login-intro h-full w-full" style={delayStyle(140)}>
                <div className="login-parallax-soft relative h-full w-full">
                  <div className="absolute inset-0 rounded-full border border-white/55 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(255,255,255,0.18))] shadow-[0_30px_90px_rgba(15,23,42,0.08)] backdrop-blur-2xl" />
                  <div className="absolute inset-3 rounded-full border border-white/40" />
                  <div className="login-breath-slow absolute inset-[7%] rounded-full border border-white/50 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.98),rgba(255,255,255,0.22)_35%,rgba(255,255,255,0.04)_60%,rgba(255,255,255,0.58)_100%)]" />

                  <div className="absolute inset-[8%] overflow-hidden rounded-full border border-white/60 shadow-inner shadow-white/50">
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
                              "z-10 translate-x-10 scale-[0.95] opacity-0",
                            slideState === "previous" &&
                              "z-0 -translate-x-10 scale-[0.95] opacity-0",
                          )}
                        >
                          <Image
                            src={slide.src}
                            alt={slide.alt}
                            fill
                            sizes="34vw"
                            priority={index === 0}
                            className="object-cover transition-transform duration-700 hover:scale-[1.04]"
                          />
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_44%,rgba(17,24,39,0.1)_100%)]" />
                        </figure>
                      );
                    })}
                  </div>

                  <div className="absolute inset-[-4%] rounded-full border border-dashed border-white/26 animate-[spin_26s_linear_infinite]" />
                </div>
              </div>
            </div>

            <div
              className="absolute left-1/2 top-[76%] z-30 flex -translate-x-1/2 items-center gap-2"
              style={delayStyle(200)}
            >
              {showcaseSlides.map((slide, index) => (
                <button
                  key={slide.src}
                  type="button"
                  aria-label={`Exibir imagem ${index + 1}`}
                  onClick={() => setActiveSlide(index)}
                  className={cn(
                    "login-intro h-2.5 rounded-full bg-[#d7d1ca] transition-all duration-500 hover:bg-[#ff8a4a]",
                    index === activeSlide ? "w-9 bg-[#ff5c00]" : "w-2.5",
                  )}
                  style={delayStyle(220 + index * 50)}
                />
              ))}
            </div>

            <div className="absolute bottom-0 left-1/2 z-30 h-[19rem] w-[24rem] -translate-x-1/2">
              <div className="login-intro h-full w-full" style={delayStyle(260)}>
                <div className="login-parallax-reverse relative h-full w-full">
                  <div className="absolute bottom-[1.8rem] left-1/2 h-[13rem] w-[18rem] -translate-x-1/2 rounded-full bg-[#ff8b38]/14 blur-3xl" />
                  <div className="login-road-perspective absolute bottom-0 left-1/2 h-[13rem] w-[18rem] -translate-x-1/2" />

                  <div className="login-bus-front-shell absolute bottom-[2.2rem] left-1/2 h-[14.5rem] w-[18rem] -translate-x-1/2">
                    <div className="login-bus-front-shadow" />
                    <div className="absolute inset-x-6 top-[0.2rem] h-4 rounded-full bg-white/18 blur-sm" />

                    <div className="absolute inset-x-2 top-4 bottom-5 overflow-hidden rounded-[3rem_3rem_2.4rem_2.4rem] border border-white/28 bg-[linear-gradient(180deg,#ff9e58_0%,#ff7418_64%,#d84f00_100%)] shadow-[0_24px_50px_rgba(255,92,0,0.28)]">
                      <div className="absolute left-1/2 top-3 h-3 w-24 -translate-x-1/2 rounded-full bg-white/16" />
                      <div className="absolute -left-1 top-9 h-9 w-1 rounded-full bg-[#ffbb88]" />
                      <div className="absolute -right-1 top-9 h-9 w-1 rounded-full bg-[#ffbb88]" />

                      <div className="absolute inset-x-8 top-5 h-[6.3rem] rounded-[2rem_2rem_1.4rem_1.4rem] border border-white/22 bg-[linear-gradient(180deg,#2c4763_0%,#1c3147_100%)] shadow-inner shadow-white/10">
                        <div className="absolute inset-x-4 top-3 h-[2px] bg-white/16" />
                        <div className="absolute left-1/2 top-3 h-14 w-[2px] -translate-x-1/2 bg-white/20" />
                        <div className="absolute inset-x-4 bottom-3 h-10 rounded-[1.2rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.48),rgba(155,212,255,0.18)_58%,rgba(255,255,255,0.08)_100%)]" />
                      </div>

                      <div className="absolute inset-x-6 bottom-10 h-9 rounded-[1.5rem] bg-[#973600]/22" />
                      <div className="absolute left-1/2 bottom-5 h-11 w-16 -translate-x-1/2 rounded-[1.2rem] border border-white/18 bg-[linear-gradient(180deg,#ff9b52_0%,#ff7117_100%)] shadow-inner shadow-white/10">
                        <div className="absolute inset-x-3 top-3 h-2 rounded-full bg-white/16" />
                        <div className="absolute inset-x-4 bottom-3 h-1.5 rounded-full bg-[#823200]/26" />
                      </div>

                      <div className="absolute left-6 bottom-7 h-6 w-7 rounded-[1rem] bg-[#ffdcae] shadow-[0_0_18px_rgba(255,220,169,0.85)]" />
                      <div className="absolute right-6 bottom-7 h-6 w-7 rounded-[1rem] bg-[#ffdcae] shadow-[0_0_18px_rgba(255,220,169,0.85)]" />
                      <div className="absolute left-10 bottom-8 h-2 w-10 rounded-full bg-white/18" />
                      <div className="absolute right-10 bottom-8 h-2 w-10 rounded-full bg-white/18" />
                    </div>

                    <div className="login-front-wheel absolute bottom-0 left-[0.5rem]" />
                    <div className="login-front-wheel absolute bottom-0 right-[0.5rem]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative flex items-center justify-center lg:justify-end">
          <div
            className="login-intro mx-auto w-full max-w-[28rem] lg:mx-0"
            style={delayStyle(180)}
          >
            <div className="rounded-[34px] border border-[#e8e3db] bg-white/92 px-6 py-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-[18px] transition-transform duration-700 hover:-translate-y-1 sm:px-8 sm:py-8">
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
                  Entre com seu e-mail corporativo.
                </p>
              </div>

              <form onSubmit={handleLogin} className="mt-7 space-y-4">
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
