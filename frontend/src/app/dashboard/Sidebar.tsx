"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  BookUserIcon,
  Building2,
  ClipboardList,
  Compass,
  FileBarChart2,
  Home,
  Layers3,
  LogOut,
  Route,
  Smartphone,
  SmartphoneNfcIcon,
  Truck,
  Users,
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

        <div>
          {isOpen && (
            <p className="mb-2 text-xs uppercase text-muted-foreground">
              Aplicativo
            </p>
          )}

          <SidebarItem
            href="/dashboard/app"
            icon={<Smartphone size={25} />}
            label="Aplicativo"
            isOpen={isOpen}
            active={pathname === "/dashboard/app"}
          />
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
              href="/dashboard/boarding"
              icon={<ClipboardList size={25} />}
              label="Embarques"
              isOpen={isOpen}
              active={pathname === "/dashboard/boarding"}
            />

            <SidebarItem
              href="/dashboard/students"
              icon={<BookUserIcon size={25} />}
              label="Alunos"
              isOpen={isOpen}
              active={pathname === "/dashboard/students"}
            />

            <SidebarItem
              href="/dashboard/groups"
              icon={<Layers3 size={25} />}
              label="Grupos"
              isOpen={isOpen}
              active={pathname === "/dashboard/groups"}
            />

            <SidebarItem
              href="/dashboard/buses"
              icon={<Truck size={25} />}
              label="Ônibus"
              isOpen={isOpen}
              active={pathname === "/dashboard/buses"}
            />
            {canViewOperations && (
              <SidebarItem
                href="/dashboard/routes"
                icon={<Route size={25} />}
              label="Rotas"
              isOpen={isOpen}
              active={
                pathname === "/dashboard/routes" ||
                pathname.startsWith("/dashboard/routes/")
              }
            />
            )}

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
                Administração
              </p>
            )}

            <SidebarItem
              href="/dashboard/company"
              icon={<Building2 size={25} />}
              label="Empresa"
              isOpen={isOpen}
              active={pathname === "/dashboard/company"}
            />

            <SidebarItem
              href="/dashboard/users"
              icon={<Users size={25} />}
              label="Usuários"
              isOpen={isOpen}
              active={pathname === "/dashboard/users"}
            />

            <SidebarItem
              href="/dashboard/reports"
              icon={<FileBarChart2 size={25} />}
              label="Relatórios"
              isOpen={isOpen}
              active={pathname === "/dashboard/reports"}
            />
          </div>
        )}
      </nav>

      <div className="p-2">
        <button
          onClick={logout}
          className={`
            flex w-full cursor-pointer items-center rounded-lg py-2 text-red-500 transition-all
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
