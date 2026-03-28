"use client";

import { Compass, LoaderCircle, RefreshCcw, Route, SmartphoneNfcIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LocationMapPanel } from "./components/LocationMapPanel";
import { useLocationOverview } from "./hooks/useLocationOverview";

export default function LocationPage() {
  const {
    buses,
    selectedBusId,
    setSelectedBusId,
    loading,
    isRefreshing,
    error,
    refetch,
    viewModel,
  } = useLocationOverview();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Localização</h1>
          <p className="text-sm text-muted-foreground">
            Escolha um ônibus para acompanhar o mapa operacional e preparar a
            experiência de localização em tempo real do UniPass.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => refetch()}
          className="w-full md:w-auto"
        >
          <RefreshCcw className={isRefreshing ? "animate-spin" : ""} />
          Atualizar visão
        </Button>
      </div>

      <Card className="space-y-4 border-0 p-5 shadow-sm ring-1 ring-border/60">
        <div className="grid gap-4 md:grid-cols-[minmax(0,360px)_1fr]">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#ff5c00]">
              Ônibus monitorado
            </p>
            <Select value={selectedBusId} onValueChange={setSelectedBusId}>
              <SelectTrigger className="h-11 w-full rounded-xl bg-background">
                <SelectValue
                  placeholder={
                    loading ? "Carregando ônibus..." : "Selecione um ônibus"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {buses.map((bus) => (
                  <SelectItem key={bus.id} value={bus.id}>
                    {bus.plate}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryCard
              icon={<Route className="size-4 text-[#ff5c00]" />}
              label="Ônibus carregados"
              value={String(buses.length)}
            />
            <SummaryCard
              icon={<SmartphoneNfcIcon className="size-4 text-[#ff5c00]" />}
              label="UniHub do ônibus"
              value={viewModel.linkedDevice ? "Vinculado" : "Pendente"}
            />
            <SummaryCard
              icon={<Compass className="size-4 text-[#ff5c00]" />}
              label="Status atual"
              value={labelForState(viewModel.state)}
            />
          </div>
        </div>
      </Card>

      {loading ? (
        <Card className="flex min-h-[440px] items-center justify-center border-0 p-6 shadow-sm ring-1 ring-border/60">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <LoaderCircle className="size-5 animate-spin text-[#ff5c00]" />
            Carregando visão de localização...
          </div>
        </Card>
      ) : error ? (
        <Card className="border-0 p-6 shadow-sm ring-1 ring-border/60">
          <p className="text-sm font-medium text-red-600">{error}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Atualize a página ou tente novamente em instantes.
          </p>
        </Card>
      ) : (
        <LocationMapPanel viewModel={viewModel} />
      )}
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-muted/35 px-4 py-3 ring-1 ring-border/60">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}

function labelForState(state: ReturnType<typeof useLocationOverview>["viewModel"]["state"]) {
  switch (state) {
    case "no-buses":
      return "Sem ônibus";
    case "needs-pairing":
      return "Pareamento necessário";
    case "no-online-device":
      return "Sem dispositivo online";
    case "awaiting-gps":
      return "Aguardando GPS";
    default:
      return "Indefinido";
  }
}
