"use client";

import { ReactNode } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { SidebarProvider } from "@/app/contexts/SidebarContext";
import { Toaster } from "sonner";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading, sessionExpired } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user && !sessionExpired) {
      router.push("/login");
    }
  }, [loading, user, sessionExpired, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#ff5c00] border-t-transparent" />
      </div>
    );
  }

  if (!user && sessionExpired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fff8f4]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#ff5c00] border-t-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">
            Sua sessão expirou. Redirecionando para o login...
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <SidebarProvider>
      <div className="h-screen flex flex-col overflow-hidden">
        <Topbar />

        <div className="flex flex-1 min-h-0">
          <Sidebar />
          <Toaster richColors position="top-right" />
          <main className="flex-1 min-h-0 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
