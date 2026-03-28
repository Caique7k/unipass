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
        unipass-scrollbar bg-sidebar text-sidebar-foreground shadow-sm flex h-full min-h-0 flex-col overflow-y-auto transition-all duration-300 border-r border-sidebar-border
        ${isOpen ? "w-64" : "w-20"}
      `}
    >
      <div
        className={`
          min-h-16 flex items-center
          ${isOpen ? "px-3 py-3 justify-start" : "justify-center"}
        `}
      >
        {loading ? (
          <span className="h-5 w-24 animate-pulse rounded bg-sidebar-accent" />
        ) : (
          user &&
          (isOpen ? (
            <div className="flex w-full items-center gap-3 rounded-2xl  px-3 py-2">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  Bem-vindo
                </p>
                <p className="truncate text-sm font-semibold">{user.name}</p>
              </div>
            </div>
          ) : (
            <div></div>
          ))
        )}
      </div>

      <nav className="flex-1 p-2 space-y-6">
        <div>
          {isOpen && (
            <p className="text-xs uppercase text-muted-foreground mb-2">
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
              <p className="text-xs uppercase text-muted-foreground mb-2">
                Gestao
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
              label="Onibus"
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
              <p className="text-xs uppercase text-muted-foreground mb-2">
                Usuarios
              </p>
            )}

            <SidebarItem
              href="/dashboard/users"
              icon={<Users size={25} />}
              label="Usuarios"
              isOpen={isOpen}
              active={pathname === "/dashboard/users"}
            />
          </div>
        )}

        {isStudentUser && isOpen && (
          <div>
            <p className="text-xs uppercase text-muted-foreground mb-2">
              App aluno
            </p>
            <p className="px-3 text-xs text-muted-foreground">
              Rastreamento, boleto e presenca entram nos proximos passos.
            </p>
          </div>
        )}
      </nav>

      <div className="p-2">
        <button
          onClick={logout}
          className={`
            flex items-center w-full py-2 rounded-lg text-red-500 transition-all cursor-pointer
            hover:bg-sidebar-accent
            ${isOpen ? "gap-3 px-3 justify-start" : "justify-center"}
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
        flex items-center py-2 rounded-lg transition-all
        ${isOpen ? "gap-3 px-3 justify-start" : "justify-center"}
        ${
          active
            ? "bg-[#ff5c00] text-white"
            : "hover:bg-sidebar-accent text-sidebar-foreground"
        }
      `}
    >
      {icon}
      {isOpen && <span>{label}</span>}
    </Link>
  );
}
