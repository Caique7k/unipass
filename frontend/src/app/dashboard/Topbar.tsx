"use client";

import { Menu, Moon, Sun } from "lucide-react";
import { useSidebar } from "@/app/contexts/SidebarContext";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/app/contexts/AuthContext";
import { useTheme } from "@/app/contexts/ThemeContext";

export default function Topbar() {
  const { toggle } = useSidebar();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const homeHref =
    user?.role === "PLATFORM_ADMIN" ? "/dashboard/companies" : "/dashboard";

  return (
    <header className="sticky top-0 z-30 h-18 bg-background/85 px-4 md:px-6 backdrop-blur-xl">
      <div className="relative flex h-full items-center justify-between gap-3 md:gap-4">
        <button
          onClick={toggle}
          className="inline-flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-2xl border border-border/60 bg-card/80 text-foreground transition hover:-translate-y-0.5 hover:bg-accent cursor-pointer"
        >
          <Menu size={20} />
        </button>

        <div className="absolute left-1/2 -translate-x-1/2">
          <Link
            href={homeHref}
            className="flex cursor-pointer items-center gap-2 rounded-[24px] px-3 py-2 backdrop-blur md:gap-3 md:px-4 md:py-2.5"
          >
            <div className="flex h-9 w-9 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-2xl">
              <Image
                src="/logo_unipass.svg"
                alt="UniPass Logo"
                width={24}
                height={24}
              />
            </div>
            <div className="min-w-0 leading-tight pr-1">
              <p className="hidden sm:block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Plataforma
              </p>
              <span className="block truncate text-base md:text-lg font-bold text-[#ff5c00]">
                UniPass
              </span>
            </div>
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="inline-flex h-10 md:h-11 items-center gap-2 rounded-2xl border border-border/60 bg-card/80 px-3 md:px-4 text-sm font-medium text-foreground transition hover:-translate-y-0.5 hover:bg-accent cursor-pointer"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ff5c00]/12 text-[#ff5c00]">
              {theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
            </span>
            <span className="hidden lg:inline">
              {theme === "dark" ? "Modo escuro" : "Modo claro"}
            </span>
          </button>

          <div className="hidden xl:flex items-center gap-2 rounded-2xl border border-border/60 bg-card/80 px-2.5 py-1.5 shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ff5c00] text-xs font-bold text-white">
              {user?.name?.charAt(0)}
            </div>
            <div className="max-w-[140px] leading-tight">
              <p className="truncate text-xs font-semibold">{user?.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
