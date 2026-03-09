"use client";

import { useState } from "react";
import { api } from "@/services/api";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
    } catch (error) {
      alert("Invalid credentials");
    }
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded shadow-md w-80"
      >
        <h1 className="text-xl mb-4 font-bold">UniPass Login</h1>

        <input
          className="border w-full mb-3 p-2"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="border w-full mb-3 p-2"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="bg-blue-500 text-white w-full p-2 rounded"
          type="submit"
        >
          Login
        </button>
      </form>
    </div>
  );
}
