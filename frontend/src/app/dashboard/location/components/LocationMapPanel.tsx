import {
  AlertTriangle,
  Compass,
  MapPinned,
  RadioTower,
  Route,
  SmartphoneNfcIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import type { LocationViewModel } from "../types";

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

  return (
    <StateCard
      icon={<RadioTower className="size-5" />}
      title="Aguardando telemetria de GPS"
      description="O UniHub já está vinculado, mas ainda não recebemos coordenadas para desenhar o trajeto no mapa."
    />
  );
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
    <Card className="overflow-hidden border-0 p-0 shadow-sm ring-1 ring-border/60">
      <div className="relative min-h-[440px] overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(255,92,0,0.14),_transparent_30%),linear-gradient(135deg,_rgba(255,255,255,0.92),_rgba(247,247,247,0.98))]">
        <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.06)_1px,transparent_1px)] [background-size:48px_48px]" />
        <div className="absolute -left-10 top-14 h-52 w-52 rounded-full bg-[#ff5c00]/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-sky-200/30 blur-3xl" />

        <div className="absolute left-[8%] top-[18%] h-3 w-[42%] rotate-[18deg] rounded-full bg-slate-300/55" />
        <div className="absolute left-[20%] top-[56%] h-3 w-[48%] -rotate-[12deg] rounded-full bg-slate-300/50" />
        <div className="absolute left-[58%] top-[22%] h-[42%] w-3 rounded-full bg-slate-300/45" />

        <div className="relative z-10 flex min-h-[440px] flex-col justify-between p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="rounded-2xl bg-background/80 px-4 py-3 backdrop-blur ring-1 ring-border/60">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#ff5c00]">
                Mapa operacional
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {viewModel.selectedBus
                  ? `Ônibus ${viewModel.selectedBus.plate}`
                  : "Selecione um ônibus"}
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-full bg-background/80 px-3 py-2 text-xs text-muted-foreground backdrop-blur ring-1 ring-border/60">
              <MapPinned className="size-4 text-[#ff5c00]" />
              Visão inspirada em navegação ao vivo
            </div>
          </div>

          <StatusMessage viewModel={viewModel} />

          <div className="grid gap-3 md:grid-cols-3">
            <InfoChip
              icon={<Compass className="size-4 text-[#ff5c00]" />}
              label="Status do mapa"
              value={
                viewModel.state === "awaiting-gps"
                  ? "Pronto para GPS"
                  : "Aguardando dados"
              }
            />
            <InfoChip
              icon={<SmartphoneNfcIcon className="size-4 text-[#ff5c00]" />}
              label="UniHub vinculado"
              value={viewModel.linkedDevice ? "Sim" : "Não"}
            />
            <InfoChip
              icon={<RadioTower className="size-4 text-[#ff5c00]" />}
              label="Dispositivos online"
              value={String(viewModel.activeDevices.length)}
            />
          </div>
        </div>
      </div>
    </Card>
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
