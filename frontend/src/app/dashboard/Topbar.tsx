"use client";

import { Menu } from "lucide-react";
import { useSidebar } from "@/app/contexts/SidebarContext";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/app/contexts/AuthContext";

export default function Topbar() {
  const { toggle } = useSidebar();
  const { user } = useAuth();
  const homeHref =
    user?.role === "PLATFORM_ADMIN" ? "/dashboard/companies" : "/dashboard";

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-gray-800 shadow-sm">
      {/* ESQUERDA */}
      <div className="flex items-center">
        <button
          onClick={toggle}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition cursor-pointer"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* CENTRO (LOGO CENTRALIZADA REAL) */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <Link href={homeHref} className="flex items-center gap-2">
          <Image
            src="/logo_unipass.svg"
            alt="UniPass Logo"
            width={28}
            height={28}
          />
          <span className="text-lg font-bold text-[#ff5c00]">UniPass</span>
        </Link>
      </div>

      {/* DIREITA (ESPAÇO DE BALANCEAMENTO) */}
      <div className="w-8" />
    </header>
  );
}
