import { Compass } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function LocationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Localização</h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe a evolução do módulo de localização em tempo real do
          UniPass.
        </p>
      </div>

      <Card className="overflow-hidden border-0 bg-gradient-to-br from-[#ff5c00]/8 via-background to-background p-6 shadow-sm ring-1 ring-border/60">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#ff5c00]/20 bg-[#ff5c00]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#ff5c00]">
              <Compass size={14} />
              Em breve
            </div>

            <div>
              <h2 className="text-xl font-semibold">
                O &quot;Waze&quot; do UniPass começa aqui
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Esta área vai concentrar mapa ao vivo, posição dos ônibus,
                acompanhamento de rotas e visão operacional em tempo real.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-border bg-background/80 p-4 text-sm text-muted-foreground">
            Primeiro objetivo: exibir a localização dos ônibus em tempo real no
            painel.
          </div>
        </div>
      </Card>
    </div>
  );
}
