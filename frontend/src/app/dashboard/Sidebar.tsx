"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  Home,
  Users,
  Truck,
  LogOut,
  SmartphoneNfcIcon,
  BookUserIcon,
  Compass,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/app/contexts/SidebarContext";
import { useAuth } from "@/app/contexts/AuthContext";
import { hasRole } from "@/lib/permissions";

export default function Sidebar() {
  const pathname = usePathname();
  const { isOpen } = useSidebar();
  const { user, loading, logout } = useAuth();
  const canManageCompany = hasRole(user?.role, ["ADMIN"]);
  const canViewOperations = hasRole(user?.role, [
    "ADMIN",
    "DRIVER",
    "COORDINATOR",
  ]);
  const isPlatformAdmin = hasRole(user?.role, ["PLATFORM_ADMIN"]);
  const isStudentUser = hasRole(user?.role, ["USER"]);

  return (
    <aside
      className={`
        unipass-scrollbar flex h-full min-h-0 flex-col overflow-y-auto border-r border-sidebar-border
        bg-background/85 text-sidebar-foreground shadow-sm backdrop-blur-xl transition-all duration-300
        ${isOpen ? "w-64" : "w-20"}
      `}
    >
      <div
        className={`
          min-h-16 flex items-center
          ${isOpen ? "justify-start px-3 py-3" : "justify-center"}
        `}
      >
        {loading ? (
          <span className="h-5 w-24 animate-pulse rounded bg-sidebar-accent" />
        ) : (
          user &&
          (isOpen ? (
            <div className="flex w-full items-center gap-3 rounded-2xl bg-sidebar-accent/80 px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  Bem-vindo
                </p>
                <p className="truncate text-sm font-semibold">{user.name}</p>
              </div>
            </div>
          ) : (
            <div />
          ))
        )}
      </div>

      <nav className="flex-1 space-y-6 p-2">
        <div>
          {isOpen && (
            <p className="mb-2 text-xs uppercase text-muted-foreground">
              Principal
            </p>
          )}

          {isPlatformAdmin ? (
            <SidebarItem
              href="/dashboard/companies"
              icon={<Home size={25} />}
              label="Empresas"
              isOpen={isOpen}
              active={pathname === "/dashboard/companies"}
            />
          ) : (
            <SidebarItem
              href="/dashboard"
              icon={<Home size={25} />}
              label="Dashboard"
              isOpen={isOpen}
              active={pathname === "/dashboard"}
            />
          )}
        </div>

        {canViewOperations && (
          <div>
            {isOpen && (
              <p className="mb-2 text-xs uppercase text-muted-foreground">
                Localização
              </p>
            )}

            <SidebarItem
              href="/dashboard/location"
              icon={<Compass size={25} />}
              label="Localização"
              isOpen={isOpen}
              active={pathname === "/dashboard/location"}
            />
          </div>
        )}

        {canViewOperations && (
          <div>
            {isOpen && (
              <p className="mb-2 text-xs uppercase text-muted-foreground">
                Gestão
              </p>
            )}

            <SidebarItem
              href="/dashboard/students"
              icon={<BookUserIcon size={25} />}
              label="Alunos"
              isOpen={isOpen}
              active={pathname === "/dashboard/students"}
            />

            <SidebarItem
              href="/dashboard/buses"
              icon={<Truck size={25} />}
              label="Ônibus"
              isOpen={isOpen}
              active={pathname === "/dashboard/buses"}
            />

            {canManageCompany && (
              <SidebarItem
                href="/dashboard/devices"
                icon={<SmartphoneNfcIcon size={25} />}
                label="UniHub"
                isOpen={isOpen}
                active={pathname === "/dashboard/devices"}
              />
            )}
          </div>
        )}

        {canManageCompany && (
          <div>
            {isOpen && (
              <p className="mb-2 text-xs uppercase text-muted-foreground">
                Usuários
              </p>
            )}

            <SidebarItem
              href="/dashboard/users"
              icon={<Users size={25} />}
              label="Usuários"
              isOpen={isOpen}
              active={pathname === "/dashboard/users"}
            />
          </div>
        )}

        {isStudentUser && isOpen && (
          <div>
            <p className="mb-2 text-xs uppercase text-muted-foreground">
              App aluno
            </p>
            <p className="px-3 text-xs text-muted-foreground">
              Rastreamento, boleto e presença entram nos próximos passos.
            </p>
          </div>
        )}
      </nav>

      <div className="p-2">
        <button
          onClick={logout}
          className={`
            flex w-full items-center rounded-lg py-2 text-red-500 transition-all cursor-pointer
            hover:bg-sidebar-accent/80
            ${isOpen ? "justify-start gap-3 px-3" : "justify-center"}
          `}
        >
          <LogOut size={25} />
          {isOpen && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}

function SidebarItem({
  href,
  icon,
  label,
  isOpen,
  active,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  isOpen: boolean;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`
        flex cursor-pointer items-center rounded-lg py-2 transition-all
        ${isOpen ? "justify-start gap-3 px-3" : "justify-center"}
        ${
          active
            ? "bg-[#ff5c00] text-white"
            : "text-sidebar-foreground hover:bg-sidebar-accent/80"
        }
      `}
    >
      {icon}
      {isOpen && <span>{label}</span>}
    </Link>
  );
}
