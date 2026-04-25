"use client"; // Indica para o Next.js que este componente roda no navegador (Client-Side Rendering), necessário pois usamos hooks como useState e eventos de clique.

import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Sparkles,
  ZoomIn,
  ZoomOut,
  X,
} from "lucide-react"; // Ícones usados em botões e inputs
import { toast } from "sonner"; // Biblioteca para exibir as notificações (alertas de sucesso/erro)
import { useAuth } from "@/app/contexts/AuthContext"; // Seu contexto de autenticação global
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils"; // Utilitário clássico do shadcn/ui para mesclar classes Tailwind
import { api } from "@/services/api"; // Instância do Axios (provavelmente apontando para o seu backend NestJS)

// Chave para salvar a preferência do usuário no navegador
const REMEMBER_STORAGE_KEY = "unipass-remember-me";

// ==========================================
// DADOS DO CARROSSEL (Lado Esquerdo)
// ==========================================
const showcaseSlides = [
  {
    src: "/unipass/unipass-painel-central.png",
    alt: "Painel central do UniPass",
    eyebrow: "Painel central",
    title: "Visão clara da operação.",
    badge: "Ao vivo",
  },
  {
    src: "/unipass/unipass-gestao-alunos.png",
    alt: "Gestão de alunos no UniPass",
    eyebrow: "Gestão de alunos",
    title: "Cadastros mais organizados.",
    badge: "Fluxo rápido",
  },
  {
    src: "/unipass/unipass-monitoramento-frota.png",
    alt: "Monitoramento da frota no UniPass",
    eyebrow: "Monitoramento de frota",
    title: "Frota e telemetria no mesmo lugar.",
    badge: "Visão completa",
  },
];

const quickHighlights = ["Tempo real", "RFID + GPS", "Acesso seguro"];
const defaultCarouselFocus = { x: 0.5, y: 0.5 };

// Função auxiliar para injetar variáveis CSS de delay nas animações de entrada
function delayStyle(delay: number): CSSProperties {
  return { "--login-delay": `${delay}ms` } as CSSProperties;
}

function getRelativePointerPosition(
  element: HTMLDivElement,
  clientX: number,
  clientY: number,
) {
  const rect = element.getBoundingClientRect();
  const x = (clientX - rect.left) / rect.width;
  const y = (clientY - rect.top) / rect.height;

  return {
    x: Math.min(Math.max(x, 0), 1),
    y: Math.min(Math.max(y, 0), 1),
  };
}

export default function LoginPage() {
  const router = useRouter(); // Navegação programática do Next.js
  const { refreshUser } = useAuth(); // Função do seu AuthContext para atualizar o estado global do usuário

  // ==========================================
  // ESTADOS DO COMPONENTE
  // ==========================================
  const [activeSlide, setActiveSlide] = useState(0); // Controla qual imagem do carrossel está visível
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // Alterna entre ver e ocultar a senha (Eye/EyeOff)
  const [rememberMe, setRememberMe] = useState(false); // Estado do checkbox de "Manter conectado"
  const [errorModal, setErrorModal] = useState(false); // Controla a exibição do modal de erro customizado
  const [loading, setLoading] = useState(false); // Controla o estado de carregamento do botão de submit
  const [isHoveringCarousel, setIsHoveringCarousel] = useState(false);
  const [isZoomedCarousel, setIsZoomedCarousel] = useState(false);
  const [mousePos, setMousePos] = useState(defaultCarouselFocus);
  const [zoomOrigin, setZoomOrigin] = useState(defaultCarouselFocus);
  const carouselRef = useRef<HTMLDivElement>(null);

  // ==========================================
  // EFEITOS COLATERAIS (useEffect)
  // ==========================================
  
  // 1. Ao carregar a tela, verifica se o usuário tinha marcado "Lembrar-me" na última visita
  useEffect(() => {
    const savedValue = window.localStorage.getItem(REMEMBER_STORAGE_KEY);
    setRememberMe(savedValue === "true");
  }, []);

  // 2. Loop infinito para trocar os slides do carrossel automaticamente a cada 5.2 segundos
  useEffect(() => {
    if (isHoveringCarousel) return; // Pausa quando mouse está em cima
    if (isZoomedCarousel) return;
    const intervalId = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % showcaseSlides.length);
    }, 5200);
    return () => window.clearInterval(intervalId);
  }, [isHoveringCarousel, isZoomedCarousel]);

  useEffect(() => {
    setIsZoomedCarousel(false);
    setMousePos(defaultCarouselFocus);
    setZoomOrigin(defaultCarouselFocus);
  }, [activeSlide]);

  // Handler para rastrear posição do mouse
  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    setMousePos(
      getRelativePointerPosition(e.currentTarget, e.clientX, e.clientY),
    );
  }

  function handleCarouselClick(e: React.MouseEvent<HTMLDivElement>) {
    const nextPosition = getRelativePointerPosition(
      e.currentTarget,
      e.clientX,
      e.clientY,
    );

    if (isZoomedCarousel) {
      setIsZoomedCarousel(false);
      setMousePos(defaultCarouselFocus);
      setZoomOrigin(defaultCarouselFocus);
      return;
    }

    setMousePos(nextPosition);
    setZoomOrigin(nextPosition);
    setIsZoomedCarousel(true);
  }

  function handleCarouselKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();

    if (isZoomedCarousel) {
      setIsZoomedCarousel(false);
      setMousePos(defaultCarouselFocus);
      setZoomOrigin(defaultCarouselFocus);
      return;
    }

    setZoomOrigin(mousePos);
    setIsZoomedCarousel(true);
  }

  // ==========================================
  // LÓGICA DE SUBMISSÃO (O Login em si)
  // ==========================================
  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); // Evita que a página recarregue ao dar submit no formulário

    // Validações básicas de front-end
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
        ...(rememberMe ? { rememberMe: true } : {}), // Só envia a flag de rememberMe se estiver ativa
      };

      try {
        // Tenta fazer o login completo
        await api.post("/auth/login", payload);
      } catch (error) {
        // Bloco engenhoso: Tratamento de erro específico para caso o backend 
        // ainda não suporte o campo "rememberMe" no contrato da API.
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
          throw error; // Se for um erro real (senha errada, etc), lança para o catch principal
        }

        // Se o erro foi só por causa do rememberMe, tenta logar de novo sem o campo
        await api.post("/auth/login", {
          email: email.trim(),
          password,
        });
        toast.warning(
          "O backend ainda não aplicou 'Manter conectado'. Entrando sem persistência.",
        );
      }

      // Sucesso no login: salva a preferência, atualiza contexto e redireciona pro dashboard
      window.localStorage.setItem(REMEMBER_STORAGE_KEY, String(rememberMe));
      toast.success("Login realizado com sucesso.");
      await refreshUser();
      router.push("/dashboard");
    } catch (error) {
      // Captura e tratamento de erros reais (401 Não Autorizado, etc)
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast.error("E-mail ou senha inválidos.");
      } else {
        const message = axios.isAxiosError(error)
          ? error.response?.data?.message
          : null;

        if (Array.isArray(message) && typeof message[0] === "string") {
          toast.error(message[0]);
        } else if (typeof message === "string") {
          toast.error(message);
        } else {
          toast.error("Não foi possível entrar agora.");
        }
      }

      setErrorModal(true); // Abre o modal visual de erro
    } finally {
      setLoading(false); // Desativa o estado de carregamento do botão independente de sucesso ou falha
    }
  }

  // ==========================================
  // ESTRUTURA VISUAL DA TELA (JSX)
  // ==========================================
  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#fcfaf7_0%,#f7f4ef_30%,#eef3f8_100%)] text-[#111827]">
      
      {/* BACKGROUND EFFECTS: Formas e gradientes abstratos que ficam atrás de tudo */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="login-breath-slow absolute -left-32 top-[10%] h-88 w-88 rounded-full bg-[#ff7a1a]/18 blur-3xl" />
        <div className="login-breath absolute -right-24 -top-8 h-72 w-[18rem] rounded-full bg-[#0f6aad]/16 blur-3xl" />
        <div className="login-breath-fast absolute -bottom-40 left-[18%] h-96 w-[24rem] rounded-full bg-[#ff5c00]/14 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.98),transparent_42%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.6),transparent_32%,rgba(255,255,255,0.38)_100%)]" />
      </div>

      <div className="relative mx-auto flex h-screen w-full max-w-7xl items-center px-4 py-4 sm:px-6 lg:px-8 lg:py-6 overflow-hidden">
        
        {/* GRID PRINCIPAL: Divide a tela em duas colunas (Esq/Dir) em telas grandes (xl) */}
        <div className="grid w-full gap-5 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-center xl:gap-6">
          
          {/* ==========================================
              LADO ESQUERDO: APRESENTAÇÃO E CARROSSEL 
              ========================================== */}
          <section className="order-2 hidden xl:block xl:order-1 max-h-screen overflow-hidden">
            <div className="mx-auto max-w-3xl xl:mx-0 xl:max-w-none overflow-hidden rounded-[28px]">
              
              {/* Badge superior (Plataforma UniPass) */}
              <div className="login-intro inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/76 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5d5b56] shadow-[0_12px_30px_rgba(15,23,42,0.05)] backdrop-blur-xl">
                <Sparkles className="size-3.5 text-[#ff5c00]" />
                Plataforma UniPass
              </div>

              {/* Título Principal */}
              <div className="login-intro mt-2 max-w-2xl" style={delayStyle(80)}>
                <h1 className="max-w-2xl text-2xl font-semibold tracking-[-0.06em] text-[#0f172a]">
                  Entrar no UniPass
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-[#475569]">
                  Acesso simples, claro e consistente com o restante da plataforma.
                </p>
              </div>

              {/* Tags de Destaque Rápido ("Tempo real", etc) */}
              <div
                className="login-intro mt-2.5 flex flex-wrap gap-2"
                style={delayStyle(130)}
              >
                {quickHighlights.map((highlight) => (
                  <div
                    key={highlight}
                    className="rounded-full border border-white/80 bg-white/74 px-3 py-1 text-xs font-semibold text-[#334155] shadow-[0_12px_28px_rgba(15,23,42,0.05)] backdrop-blur-xl"
                  >
                    {highlight}
                  </div>
                ))}
              </div>

              {/* Bloco do Carrossel de Telas (Dashboard, Estudantes, Ônibus) */}
              <div
                className="login-intro mt-2 isolate overflow-hidden rounded-[28px] border border-white/85 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(247,248,251,0.82))] p-2.5 shadow-[0_28px_70px_rgba(15,23,42,0.1)] backdrop-blur-2xl [&>div]:overflow-hidden [&>div]:rounded-[24px]"
                style={delayStyle(170)}
              >
                <div className="rounded-[24px] border border-black/5 bg-[#f8f7f3] p-2 shadow-inner shadow-white/80 overflow-hidden">
                  
                  {/* Cabeçalho do mockup (bolinhas estilo macOS e link de cadastro) */}
                  <div className="flex items-center justify-between gap-3 px-1 pb-2">
                    <div className="flex items-center gap-2 px-1 pb-2">
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

                  {/* Área onde as Imagens trocam */}
                  <div className="relative overflow-hidden rounded-[20px] border border-white/80 bg-[#eef2f7]">
                    <div
                      ref={carouselRef}
                      className={cn(
                        "relative aspect-16/10 w-full max-h-[59vh] outline-none",
                        isZoomedCarousel ? "cursor-zoom-out" : "cursor-zoom-in",
                      )}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isZoomedCarousel}
                      aria-label={
                        isZoomedCarousel
                          ? "Reduzir zoom da imagem do carrossel"
                          : "Ampliar imagem do carrossel"
                      }
                      onMouseEnter={() => setIsHoveringCarousel(true)}
                      onMouseLeave={() => {
                        setIsHoveringCarousel(false);
                        if (!isZoomedCarousel) {
                          setMousePos(defaultCarouselFocus);
                        }
                      }}
                      onMouseMove={handleMouseMove}
                      onClick={handleCarouselClick}
                      onKeyDown={handleCarouselKeyDown}
                    >
                      <div className="pointer-events-none absolute left-3 top-3 z-30 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-white/72 text-[#475569] shadow-[0_10px_24px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                        {isZoomedCarousel ? (
                          <ZoomOut className="size-3.5 text-[#0f6aad]" />
                        ) : (
                          <ZoomIn className="size-3.5 text-[#ff5c00]" />
                        )}
                      </div>

                      {showcaseSlides.map((slide, index) => (
                        <figure
                          key={slide.src}
                          className={cn(
                            "absolute inset-0 transition-all duration-900 ease-[cubic-bezier(0.22,1,0.36,1)]",
                            index === activeSlide
                              ? "z-20 scale-100 opacity-100"
                              : "z-10 scale-[1.03] opacity-0",
                          )}
                        >
                          {/* Wrapper com overflow hidden para conter o zoom */}
                          <div className="absolute inset-0 overflow-hidden rounded-[20px]">
                            <Image
                              src={slide.src}
                              alt={slide.alt}
                              fill
                              priority={index === 0}
                              unoptimized
                              sizes="(min-width: 1536px) 760px, (min-width: 1280px) 46vw, (min-width: 768px) 70vw, 92vw"
                              className="object-cover"
                              draggable={false}
                              style={{
                                objectPosition:
                                  index === activeSlide
                                    ? `${mousePos.x * 100}% ${mousePos.y * 100}%`
                                    : "50% 50%",
                                transform:
                                  index === activeSlide
                                    ? `scale(${isZoomedCarousel ? 1.72 : isHoveringCarousel ? 1.08 : 1})`
                                    : "scale(1.03)",
                                transformOrigin: `${zoomOrigin.x * 100}% ${zoomOrigin.y * 100}%`,
                                transition:
                                  index === activeSlide
                                    ? isZoomedCarousel
                                      ? "transform 0.45s cubic-bezier(0.22,1,0.36,1), object-position 100ms linear"
                                      : "transform 0.65s cubic-bezier(0.22,1,0.36,1), object-position 0.35s ease"
                                    : "transform 0.65s cubic-bezier(0.22,1,0.36,1), object-position 0.35s ease",
                              }}
                            />
                            <div
                              className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,10,18,0.02),rgba(7,10,18,0.42))] transition-opacity duration-300"
                              style={{
                                opacity:
                                  isZoomedCarousel && index === activeSlide
                                    ? 0.3
                                    : 1,
                              }}
                            />
                          </div>

                          {/* Legenda: sempre visível, desaparece no hover */}
                          <div
                            className="absolute inset-x-3 bottom-3 rounded-[18px] border border-white/20 bg-[#09111d]/72 p-3 text-white shadow-[0_18px_40px_rgba(9,17,29,0.28)] backdrop-blur-xl"
                            style={{
                              opacity:
                                (isHoveringCarousel || isZoomedCarousel) &&
                                index === activeSlide
                                  ? 0
                                  : 1,
                              transform:
                                (isHoveringCarousel || isZoomedCarousel) &&
                                index === activeSlide
                                  ? "translateY(6px)"
                                  : "translateY(0px)",
                              transition: "opacity 0.4s ease, transform 0.4s ease",
                              pointerEvents: "none",
                            }}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/74">
                                {slide.eyebrow}
                              </p>
                              <span className="rounded-full bg-[#ff5c00] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                                {slide.badge}
                              </span>
                            </div>
                            <h2 className="mt-2 max-w-lg text-base font-semibold tracking-[-0.05em] text-white">
                              {slide.title}
                            </h2>
                          </div>
                        </figure>
                      ))}
                    </div>
                  </div>

                  {/* Controles de paginação do carrossel (os "tracinhos" embaixo da imagem) */}
                  <div className="mt-2.5 flex items-center gap-2">
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

          {/* ==========================================
              LADO DIREITO: FORMULÁRIO DE LOGIN (Card Branco)
              ========================================== */}
          <section className="order-1 xl:order-2 xl:flex xl:justify-end xl:items-start xl:pt-6">
            <div
              className="login-intro mx-auto w-full max-w-104 xl:mx-0"
              style={delayStyle(160)}
            >
              <div className="rounded-[32px] border border-white/85 bg-white/90 px-5 py-4 shadow-[0_28px_80px_rgba(15,23,42,0.12)] backdrop-blur-2xl sm:px-5 sm:py-4">
                
                {/* Header do Card (Logo e botão Voltar) */}
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

                {/* Título do Formulário */}
                <div className="mt-4 rounded-[24px] border border-[#f2e6da] bg-[linear-gradient(180deg,#fffaf5_0%,#fff3ea_100%)] p-3.5">
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

                {/* INÍCIO DO FORMULÁRIO */}
                <form onSubmit={handleLogin} className="mt-4 space-y-3">
                  
                  {/* Input E-mail */}
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
                        onChange={(e) => setEmail(e.target.value)} // Atualiza estado
                        className="h-13 rounded-2xl border-[#d9cdbf] bg-[#fffdfa] pl-11 pr-4 text-[#0f172a] shadow-none placeholder:text-[#94a3b8] focus-visible:border-[#ff5c00] focus-visible:ring-[#ff5c00]/15 dark:border-[#d9cdbf] dark:bg-[#fffdfa] dark:text-[#0f172a] dark:placeholder:text-[#94a3b8]"
                      />
                    </div>
                  </div>

                  {/* Input Senha */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#111827]">
                      Senha
                    </label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#7c8899]" />
                      <Input
                        type={showPassword ? "text" : "password"} // Altera o tipo do input dependendo do estado do "olhinho"
                        placeholder="Digite sua senha"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)} // Atualiza estado
                        className="h-13 rounded-2xl border-[#d9cdbf] bg-[#fffdfa] pl-11 pr-12 text-[#0f172a] shadow-none placeholder:text-[#94a3b8] focus-visible:border-[#ff5c00] focus-visible:ring-[#ff5c00]/15 dark:border-[#d9cdbf] dark:bg-[#fffdfa] dark:text-[#0f172a] dark:placeholder:text-[#94a3b8]"
                      />

                      {/* Botão para Mostrar/Ocultar Senha */}
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

                  {/* Checkbox Manter Conectado */}
                  <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[#ecdfd2] bg-[#fff8f2] px-4 py-3 transition-colors hover:bg-white">
                    <Checkbox
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
                      className="size-4.5 border-[#d9c2ad] bg-white text-white data-checked:border-[#ff5c00] data-checked:bg-[#ff5c00] dark:border-[#d9c2ad] dark:bg-white dark:data-checked:border-[#ff5c00] dark:data-checked:bg-[#ff5c00]"
                    />
                    <span className="text-sm font-medium text-[#374151]">
                      Manter conectado neste dispositivo
                    </span>
                  </label>

                  {/* Botão de Enviar (Submit) */}
                  <Button
                    type="submit"
                    disabled={loading} // Bloqueia cliques múltiplos
                    className="h-13 w-full rounded-2xl bg-[linear-gradient(135deg,#ff5c00_0%,#ff7a1a_100%)] text-sm font-semibold text-white shadow-[0_20px_40px_rgba(255,92,0,0.28)] transition-transform hover:-translate-y-0.5 hover:opacity-95 dark:text-white"
                  >
                    {/* Renderização Condicional: Mostra loading spinner se tiver fazendo a req da API */}
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

                {/* Rodapé do Form: Link de criar conta */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
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

      {/* ==========================================
          MODAL DE ERRO CUSTOMIZADO
          Renderizado condicionalmente apenas se errorModal for 'true'
          ========================================== */}
      {errorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          
          {/* Fundo escuro (Overlay) - Clicar nele também fecha o modal */}
          <div
            className="absolute inset-0 animate-[fadeIn_0.2s_ease] bg-[#09111d]/42 backdrop-blur-sm"
            onClick={() => setErrorModal(false)}
          />

          {/* O Modal em si */}
          <div className="relative w-full max-w-sm animate-[scaleIn_0.28s_cubic-bezier(0.22,1,0.36,1)] rounded-[30px] border border-white/80 bg-[linear-gradient(180deg,#ffffff_0%,#fff7f2_100%)] p-6 shadow-[0_30px_90px_rgba(15,23,42,0.18)]">
            
            {/* Ícone de Fechar no canto superior direito */}
            <button
              onClick={() => setErrorModal(false)}
              className="absolute right-4 top-4 cursor-pointer text-[#7c8899] transition hover:text-[#334155]"
            >
              <X className="size-4" />
            </button>

            {/* Conteúdo de Erro */}
            <div className="flex size-12 items-center justify-center rounded-2xl bg-[#fff1e8] text-[#ff5c00] shadow-inner shadow-white">
              <Lock className="size-5" />
            </div>

            <h3 className="mt-5 text-xl font-semibold tracking-[-0.04em] text-[#111827]">
              Login inválido
            </h3>

            <p className="mt-2 text-sm leading-6 text-[#5b6472]">
              O e-mail ou a senha informados estão incorretos.
            </p>

            {/* Botão de Fechar o modal dentro dele */}
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
