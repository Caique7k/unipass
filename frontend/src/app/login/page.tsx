"use client";

import axios from "axios";
import Image from "next/image";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/app/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { api } from "@/services/api";

const REMEMBER_STORAGE_KEY = "unipass-remember-me";

export default function LoginPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f5f5f2] px-4 py-10 text-[#111827] dark:bg-[#f5f5f2]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-12rem] h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-white/75 blur-3xl" />
        <div className="absolute bottom-[-10rem] left-[-6rem] h-[18rem] w-[18rem] rounded-full bg-[#ffe6d4]/70 blur-3xl" />
        <div className="absolute right-[-7rem] top-[20%] h-[20rem] w-[20rem] rounded-full bg-[#e6edf9]/70 blur-3xl" />
      </div>

      <div className="relative w-full max-w-[460px] rounded-[32px] border border-[#e8e3db] bg-white px-6 py-7 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:px-8 sm:py-9">
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
          <h1 className="text-3xl font-semibold tracking-[-0.05em] text-[#111827]">
            Entrar no UniPass
          </h1>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#111827]">E-mail</label>
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
            <label className="text-sm font-medium text-[#111827]">Senha</label>
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
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
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

          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[#ebe6df] bg-[#faf8f5] px-4 py-3">
            <Checkbox
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
              className="border-[#d8d2ca] bg-white text-white data-checked:border-[#ff5c00] data-checked:bg-[#ff5c00] dark:border-[#d8d2ca] dark:bg-white dark:data-checked:border-[#ff5c00] dark:data-checked:bg-[#ff5c00]"
            />
            <span className="text-sm font-medium text-[#374151]">
              Manter conectado
            </span>
          </label>

          <Button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-2xl bg-[#ff5c00] text-sm font-semibold text-white shadow-[0_16px_32px_rgba(255,92,0,0.22)] hover:bg-[#eb5600] dark:bg-[#ff5c00] dark:text-white dark:hover:bg-[#eb5600]"
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

      {errorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/28 backdrop-blur-sm"
            onClick={() => setErrorModal(false)}
          />

          <div className="relative w-full max-w-sm rounded-[28px] border border-[#e8e3db] bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.16)]">
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
