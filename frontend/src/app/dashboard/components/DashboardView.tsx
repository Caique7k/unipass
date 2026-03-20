"use client";

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

export function DashboardView() {
  const { data, loading, error, lastUpdated } = useDashboard();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Visao geral do sistema UniPass</p>
        </div>

        <div className="text-sm text-muted-foreground">
          Atualizado as {formatLastUpdated(lastUpdated)}
        </div>
      </div>

      <DashboardContent data={data} loading={loading} error={error} />
    </div>
  );
}
