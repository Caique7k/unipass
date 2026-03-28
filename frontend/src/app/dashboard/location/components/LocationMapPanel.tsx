import {
  AlertTriangle,
  Compass,
  MapPinned,
  Route,
  SmartphoneNfcIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import type { LocationViewModel } from "../types";
import { InteractiveBusMap } from "./InteractiveBusMap";

function StatusMessage({ viewModel }: { viewModel: LocationViewModel }) {
  if (viewModel.state === "no-buses") {
    return (
      <StateCard
        icon={<Route className="size-5" />}
        title="Nenhum ônibus cadastrado"
        description="Cadastre um ônibus primeiro para começar a visualizar a operação no mapa."
      />
    );
  }

  if (viewModel.state === "needs-pairing") {
    return (
      <StateCard
        icon={<SmartphoneNfcIcon className="size-5" />}
        title="Pareie um UniHub primeiro"
        description="Este ônibus ainda não possui um UniHub vinculado. Faça o pareamento para habilitar a localização em tempo real."
      />
    );
  }

  if (viewModel.state === "no-online-device") {
    return (
      <StateCard
        icon={<AlertTriangle className="size-5" />}
        title="Nenhum dispositivo online"
        description="Ainda não encontramos nenhum dispositivo online para enviar a posição deste ônibus."
      />
    );
  }

  return null;
}

function StateCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-white/85 text-[#ff5c00] shadow-sm ring-1 ring-black/5">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function LocationMapPanel({
  viewModel,
}: {
  viewModel: LocationViewModel;
}) {
  return (
    <div className="space-y-4">
      {(viewModel.state === "live" || viewModel.state === "stale") &&
      viewModel.telemetry &&
      viewModel.selectedBus ? (
        <InteractiveBusMap
          latitude={viewModel.telemetry.latitude}
          longitude={viewModel.telemetry.longitude}
          plate={viewModel.selectedBus.plate}
          stale={viewModel.state === "stale"}
          lastUpdateLabel={viewModel.summary.lastUpdateLabel}
          speedLabel={
            viewModel.summary.speedKmh !== null
              ? `${viewModel.summary.speedKmh} km/h`
              : "Calculando"
          }
          originLabel={viewModel.summary.originLabel}
          destinationLabel={viewModel.summary.destinationLabel}
          trail={viewModel.trail}
        />
      ) : (
        <Card className="flex min-h-[560px] items-center justify-center overflow-hidden border-0 p-6 shadow-sm ring-1 ring-border/60">
          <StatusMessage viewModel={viewModel} />
        </Card>
      )}

      <div className="grid gap-3 md:grid-cols-4">
        <InfoChip
          icon={<Compass className="size-4 text-[#ff5c00]" />}
          label="Status do mapa"
          value={viewModel.summary.statusBadge}
        />
        <InfoChip
          icon={<SmartphoneNfcIcon className="size-4 text-[#ff5c00]" />}
          label="UniHub vinculado"
          value={viewModel.linkedDevice ? "Sim" : "Não"}
        />
        <InfoChip
          icon={<Route className="size-4 text-[#ff5c00]" />}
          label="Velocidade"
          value={
            viewModel.summary.speedKmh !== null
              ? `${viewModel.summary.speedKmh} km/h`
              : "-"
          }
        />
        <InfoChip
          icon={<MapPinned className="size-4 text-[#ff5c00]" />}
          label="Última leitura"
          value={viewModel.summary.lastUpdateLabel}
        />
      </div>
    </div>
  );
}

function InfoChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-background/80 px-4 py-3 backdrop-blur ring-1 ring-border/60">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}
