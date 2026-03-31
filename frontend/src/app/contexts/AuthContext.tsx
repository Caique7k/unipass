"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import { api } from "@/services/api";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/lib/permissions";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId: string | null;
  emailDomain?: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  sessionExpired: boolean;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  sessionExpired: false,
  logout: () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const router = useRouter();
  const hasHandledSessionExpirationRef = useRef(false);

  const openSessionExpiredModal = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!window.location.pathname.startsWith("/dashboard")) {
      return;
    }

    if (hasHandledSessionExpirationRef.current) {
      return;
    }

    hasHandledSessionExpirationRef.current = true;
    setSessionExpired(true);
  }, []);

  const resetSessionState = useCallback(() => {
    hasHandledSessionExpirationRef.current = false;
    setSessionExpired(false);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get("/auth/me");
      setUser(res.data);
      resetSessionState();
    } catch (error) {
      setUser(null);

      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof error.response === "object" &&
        error.response !== null &&
        "status" in error.response &&
        error.response.status === 401
      ) {
        openSessionExpiredModal();
      }
    } finally {
      setLoading(false);
    }
  }, [openSessionExpiredModal, resetSessionState]);

  async function logout() {
    try {
      await api.post("/auth/logout"); // rota backend que limpa o cookie
    } catch {}
    resetSessionState();
    setUser(null);
    router.push("/login");
  }

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    const interceptorId = api.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error?.response?.status;
        const requestUrl = String(error?.config?.url ?? "");

        if (status === 401 && !requestUrl.includes("/auth/logout")) {
          openSessionExpiredModal();
        }

        return Promise.reject(error);
      },
    );

    return () => {
      api.interceptors.response.eject(interceptorId);
    };
  }, [openSessionExpiredModal]);

  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      const [input] = args;
      const requestUrl =
        typeof input === "string"
          ? input
          : input instanceof Request
            ? input.url
            : "";

      if (response.status === 401 && !requestUrl.includes("/auth/logout")) {
        openSessionExpiredModal();
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [openSessionExpiredModal]);

  async function handleLoginAgain() {
    await logout();
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, sessionExpired, logout, refreshUser }}
    >
      {children}
      <Dialog open={sessionExpired}>
        <DialogContent
          showCloseButton={false}
          className="overflow-hidden border-0 p-0 shadow-2xl dark:bg-[#1f2127] sm:max-w-[520px]"
        >
          <div className="space-y-0">
            <div className="border-b border-border/60 bg-[#fff7f2] px-6 py-5 dark:border-white/10 dark:bg-[#2b211b]">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#ffede0] text-[#ff5c00] dark:bg-[#3a2618]">
                  <ShieldAlert className="size-6" />
                </div>
                <DialogHeader className="gap-1">
                  <DialogTitle className="text-2xl font-bold text-foreground">
                    Sua sessão expirou
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    Por segurança, seu acesso venceu. Faça login novamente para
                    continuar usando o UniPass.
                  </DialogDescription>
                </DialogHeader>
              </div>
            </div>

            <div className="space-y-4 px-6 py-5 dark:bg-[#1f2127]">
              <div className="rounded-2xl border border-[#ffd8bf] bg-[#fffaf6] p-4 text-sm text-muted-foreground dark:border-[#5b341c] dark:bg-[#17191f]">
                Seus dados continuam seguros. Basta entrar novamente para
                retomar a navegação.
              </div>

              <DialogFooter className="sm:justify-end">
                <Button
                  onClick={handleLoginAgain}
                  className="h-11 rounded-xl bg-[#ff5c00] px-5 text-sm font-semibold text-white hover:bg-[#e65300]"
                >
                  Fazer login novamente
                </Button>
              </DialogFooter>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
