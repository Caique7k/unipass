"use client";

import { ReactNode } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar user={user} />
        <main className="p-6 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
