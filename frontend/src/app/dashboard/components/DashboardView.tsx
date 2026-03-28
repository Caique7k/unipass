"use client";

import { Card } from "@/components/ui/card";
import { useAuth } from "@/app/contexts/AuthContext";
import { useDashboard } from "../../hooks/useDashboard";
import { DashboardContent } from "./DashboardContent";

function formatLastUpdated(date: Date | null) {
  if (!date) return "Atualizando...";

  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function CompanyDashboard() {
  const { data, loading, error, lastUpdated } = useDashboard();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Visao geral do sistema UniPass</p>
        </div>

        <div className="text-sm text-muted-foreground">
          Atualizado em: {formatLastUpdated(lastUpdated)}
        </div>
      </div>

      <DashboardContent data={data} loading={loading} error={error} />
    </div>
  );
}

export function DashboardView() {
  const { user } = useAuth();

  if (user?.role === "PLATFORM_ADMIN") {
    return (
      <Card className="max-w-3xl p-6">
        <h1 className="text-3xl font-bold tracking-tight">Painel da plataforma</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Este perfil representa o dono do UniPass e agora tem uma area separada
          para acompanhar as empresas cadastradas.
        </p>
      </Card>
    );
  }

  if (user?.role === "USER") {
    return (
      <Card className="max-w-3xl p-6">
        <h1 className="text-3xl font-bold tracking-tight">Area do aluno</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Este perfil ficou reservado para os proximos passos: rastreamento em
          tempo real, lembretes de boleto e presenca de ida e volta.
        </p>
      </Card>
    );
  }

  return <CompanyDashboard />;
}
