"use client";

import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, X } from "lucide-react";

const images = [
  "/unipass/unipass-bus.png",
  "/unipass/unipass-student.png",
  "/unipass/unipass-dashboard.png",
];

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currentImage, setCurrentImage] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [errorModal, setErrorModal] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      const { access_token } = response.data;

      localStorage.setItem("token", access_token);

      router.push("/dashboard");
    } catch {
      setErrorModal(true);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* LEFT SIDE - CAROUSEL */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden">
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
              className="w-full h-full object-cover flex-shrink-0"
            />
          ))}
        </div>

        <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-12 text-white">
          <h2 className="text-3xl font-semibold mb-2">Smart Transportation</h2>

          <p className="text-sm opacity-80 max-w-sm">
            UniPass connects students, buses and schools with real-time tracking
            and smart access.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE - LOGIN */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-white">
        <div className="w-full max-w-md px-10">
          {/* LOGO */}
          <div className="mb-10">
            <img src="/logo_unipass.png" className="w-14 mb-6" />

            <h1 className="text-2xl font-semibold text-gray-800">
              Bem-vindo de volta!
            </h1>

            <p className="text-gray-400 text-sm">
              Faça o login para acessar o dashboard do UniPass
            </p>
          </div>

          {/* FORM */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />

              <input
                type="email"
                placeholder="Email"
                className="w-full border border-gray-200 rounded-lg p-3 pl-10 focus:outline-none focus:ring-2 focus:ring-[#ff5c00]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />

              <input
                type={showPassword ? "text" : "password"}
                placeholder="Senha"
                className="w-full border border-gray-200 rounded-lg p-3 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-[#ff5c00]"
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
              className="w-full cursor-pointer bg-[#ff5c00] text-white py-3 rounded-lg font-medium hover:opacity-90 transition"
            >
              Login
            </button>
          </form>

          <p className="text-xs text-gray-400 mt-8">UniPass Platform</p>
        </div>
      </div>
      {errorModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 relative">
            <button
              onClick={() => setErrorModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Login inválido
            </h3>

            <p className="text-sm text-gray-500 mb-5">
              O email ou a senha informados estão incorretos.
            </p>

            <button
              onClick={() => setErrorModal(false)}
              className="w-full bg-[#ff5c00] text-white py-2 rounded-lg hover:opacity-90 transition cursor-pointer"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
