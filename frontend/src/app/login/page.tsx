"use client";

import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { Mail, Lock, Eye, EyeOff, X } from "lucide-react";
import { toast } from "sonner";

const images = [
  "/unipass/unipass-bus.png",
  "/unipass/unipass-student.png",
  "/unipass/unipass-dashboard.png",
];

export default function LoginPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currentImage, setCurrentImage] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [errorModal, setErrorModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  async function handleLogin(e: React.FormEvent) {
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
      await api.post("/auth/login", { email: email.trim(), password });
      toast.success("Login realizado com sucesso.");
      await refreshUser();
      router.push("/dashboard");
    } catch {
      toast.error("E-mail ou senha inválidos.");
      setErrorModal(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 overflow-hidden lg:flex">
        <div
          className="flex h-full transition-transform duration-[1200ms] ease-[cubic-bezier(0.77,0,0.18,1)]"
          style={{
            transform: `translateX(-${currentImage * 100}%)`,
            width: `${images.length * 100}%`,
          }}
        >
          {images.map((image, index) => (
            <img
              key={index}
              src={image}
              alt="UniPass"
              className="h-full w-full flex-shrink-0 object-cover"
            />
          ))}
        </div>

        <div className="absolute inset-0 flex flex-col justify-end bg-black/40 p-12 text-white">
          <h2 className="mb-2 text-3xl font-semibold">Smart Transportation</h2>

          <p className="max-w-sm text-sm opacity-80">
            UniPass connects students, buses and schools with real-time tracking
            and smart access.
          </p>
        </div>
      </div>

      <div className="flex w-full items-center justify-center bg-white lg:w-1/2">
        <div className="w-full max-w-md px-10">
          <div className="mb-10">
            <img src="/logo_unipass.png" className="mb-6 w-14" alt="UniPass" />

            <h1 className="text-2xl font-semibold text-gray-800">
              Bem-vindo de volta!
            </h1>

            <p className="text-sm text-gray-400">
              Faça o login para acessar o dashboard do UniPass
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />

              <input
                type="email"
                placeholder="E-mail"
                className="w-full rounded-lg border border-gray-200 p-3 pl-10 focus:outline-none focus:ring-2 focus:ring-[#ff5c00]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />

              <input
                type={showPassword ? "text" : "password"}
                placeholder="Senha"
                className="w-full rounded-lg border border-gray-200 p-3 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-[#ff5c00]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#ff5c00] py-3 font-medium text-white cursor-pointer"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          <p className="mt-8 text-xs text-gray-400">UniPass Platform</p>
        </div>
      </div>
      {errorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-fade-soft"
            onClick={() => setErrorModal(false)}
          />

          <div
            className="
      relative
      w-full
      max-w-sm
      rounded-2xl
      bg-white
      p-6
      shadow-[0_20px_60px_rgba(0,0,0,0.25)]
      animate-modal-soft
      "
          >
            <button
              onClick={() => setErrorModal(false)}
              className="absolute right-4 top-4 cursor-pointer text-gray-400 transition hover:text-gray-600"
            >
              <X size={20} />
            </button>

            <h3 className="mb-2 text-lg font-semibold text-gray-800">
              Login inválido
            </h3>

            <p className="mb-5 text-sm text-gray-500">
              O e-mail ou a senha informados estão incorretos.
            </p>

            <button
              onClick={() => setErrorModal(false)}
              className="w-full rounded-lg bg-[#ff5c00] py-2 text-white transition hover:opacity-90 cursor-pointer"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
