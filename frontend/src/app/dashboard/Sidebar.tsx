"use client";

import Link from "next/link";
import { Home, Users, Truck, FileText, LogOut } from "lucide-react";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/app/contexts/SidebarContext";
import { useAuth } from "@/app/contexts/AuthContext";

export default function Sidebar() {
  const pathname = usePathname();
  const { isOpen } = useSidebar();
  const { user, loading, logout } = useAuth();

  return (
    <aside
      className={`
        bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200
        shadow-sm flex flex-col
        transition-all duration-300
        ${isOpen ? "w-64" : "w-20"}
      `}
    >
      {/* TOPO - USUÁRIO */}
      <div
        className={`
    h-16 flex items-center
    ${isOpen ? "px-4 justify-start" : "justify-center"}
  `}
      >
        {loading ? (
          <span className="h-5 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        ) : (
          user &&
          (isOpen ? (
            <span className="font-medium text-sm truncate">
              Bem vindo, {user.name}!
            </span>
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#ff5c00] flex items-center justify-center text-white text-sm font-bold">
              {user.name?.charAt(0)}
            </div>
          ))
        )}
      </div>

      {/* NAVEGAÇÃO */}
      <nav className="flex-1 p-2 space-y-6">
        {/* Principal */}
        <div>
          {isOpen && (
            <p className="text-xs uppercase text-gray-400 mb-2">Principal</p>
          )}

          <SidebarItem
            href="/dashboard"
            icon={<Home size={20} />}
            label="Dashboard"
            isOpen={isOpen}
            active={pathname === "/dashboard"}
          />
        </div>

        {/* Gestão */}
        <div>
          {isOpen && (
            <p className="text-xs uppercase text-gray-400 mb-2">Gestão</p>
          )}

          <SidebarItem
            href="/dashboard/students"
            icon={<Users size={20} />}
            label="Alunos"
            isOpen={isOpen}
            active={pathname === "/dashboard/students"}
          />

          <SidebarItem
            href="/dashboard/buses"
            icon={<Truck size={20} />}
            label="Ônibus"
            isOpen={isOpen}
            active={pathname === "/dashboard/buses"}
          />
        </div>

        {/* Sistema */}
        <div>
          {isOpen && (
            <p className="text-xs uppercase text-gray-400 mb-2">Sistema</p>
          )}

          <SidebarItem
            href="/reports"
            icon={<FileText size={20} />}
            label="Relatórios"
            isOpen={isOpen}
            active={pathname === "/reports"}
          />
        </div>
      </nav>

      {/* RODAPÉ - LOGOUT */}
      <div className="p-2">
        <button
          onClick={logout}
          className={`
            flex items-center w-full
            ${isOpen ? "gap-3 px-3 justify-start" : "justify-center"}
            py-2 rounded-lg
            text-red-500
            hover:bg-red-100 dark:hover:bg-red-900/30
            transition-all cursor-pointer
          `}
        >
          <LogOut size={20} />
          {isOpen && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}

function SidebarItem({ href, icon, label, isOpen, active }: any) {
  return (
    <Link
      href={href}
      className={`
        flex items-center
        ${isOpen ? "gap-3 px-3 justify-start" : "justify-center"}
        py-2 rounded-lg
        transition-all
        ${
          active
            ? "bg-[#ff5c00] text-white"
            : "hover:bg-gray-200 dark:hover:bg-gray-700"
        }
      `}
    >
      {icon}
      {isOpen && <span>{label}</span>}
    </Link>
  );
}
