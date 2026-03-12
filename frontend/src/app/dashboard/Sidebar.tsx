"use client";

import Link from "next/link";
import { Home, Users, Truck, FileText } from "lucide-react";
import Image from "next/image";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 p-4 flex flex-col">
      {/* Logo + Texto */}
      <Link
        href="/dashboard"
        className="flex items-center gap-2 mb-6 cursor-pointer"
      >
        <Image
          src="/logo_unipass.svg"
          alt="UniPass Logo"
          width={32}
          height={32}
          className="w-8 h-8"
        />
        <h1 className="text-xl font-bold text-[#ff5c00]">UniPass</h1>
      </Link>

      <nav className="flex flex-col gap-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 hover:text-[#ff5c00]"
        >
          <Home size={20} /> Dashboard
        </Link>
        <Link
          href="/students"
          className="flex items-center gap-2 hover:text-[#ff5c00]"
        >
          <Users size={20} /> Alunos
        </Link>
        <Link
          href="/buses"
          className="flex items-center gap-2 hover:text-[#ff5c00]"
        >
          <Truck size={20} /> Ônibus
        </Link>
        <Link
          href="/reports"
          className="flex items-center gap-2 hover:text-[#ff5c00]"
        >
          <FileText size={20} /> Relatórios
        </Link>
      </nav>
    </aside>
  );
}
