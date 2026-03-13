"use client";

import Link from "next/link";
import Image from "next/image";
import { Home, Users, Truck, FileText } from "lucide-react";
import { useState } from "react";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="flex relative">
      {/* Botão Hamburger fixo sobre a sidebar */}
      <button
        className="absolute top-4 left-4 flex flex-col justify-between w-6 h-6 z-50 p-1"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span
          className={`block h-0.5 w-full bg-gray-700 dark:bg-gray-200 transform transition duration-300 ease-in-out origin-center
            ${isOpen ? "rotate-45 translate-y-2" : ""}`}
        />
        <span
          className={`block h-0.5 w-full bg-gray-700 dark:bg-gray-200 my-1 transition-opacity duration-300
            ${isOpen ? "opacity-0" : "opacity-100"}`}
        />
        <span
          className={`block h-0.5 w-full bg-gray-700 dark:bg-gray-200 transform transition duration-300 ease-in-out origin-center
            ${isOpen ? "-rotate-45 -translate-y-2" : ""}`}
        />
      </button>
      <div className="w-16" /> {/* Espaço para o botão hamburger */}
      {/* Sidebar */}
      <aside
        className={`bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 p-4 flex flex-col
          transition-all duration-300 ease-in-out
          ${isOpen ? "w-64" : "w-16"}
        `}
      >
        {/* Navegação */}
        <nav className="flex flex-col gap-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 hover:text-[#ff5c00] transition-colors"
          >
            <Home size={20} />
            {isOpen && "Dashboard"}
          </Link>
          <Link
            href="/students"
            className="flex items-center gap-2 hover:text-[#ff5c00] transition-colors"
          >
            <Users size={20} />
            {isOpen && "Alunos"}
          </Link>
          <Link
            href="/buses"
            className="flex items-center gap-2 hover:text-[#ff5c00] transition-colors"
          >
            <Truck size={20} />
            {isOpen && "Ônibus"}
          </Link>
          <Link
            href="/reports"
            className="flex items-center gap-2 hover:text-[#ff5c00] transition-colors"
          >
            <FileText size={20} />
            {isOpen && "Relatórios"}
          </Link>
        </nav>
      </aside>
    </div>
  );
}
