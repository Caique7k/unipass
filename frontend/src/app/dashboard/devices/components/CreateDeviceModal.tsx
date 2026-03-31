"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function CreateDeviceModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] flex-col overflow-hidden border-0 p-0 shadow-2xl sm:max-w-[620px]">
        <div className="border-b border-[#ff5c00]/10 bg-[#ff5c00]/[0.04] px-6 py-5">
          <DialogHeader className="gap-1">
            <DialogTitle className="text-2xl font-bold text-foreground">
              Como funciona o pareamento?
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Um passo a passo rápido para conectar um novo UniHub.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="unipass-scrollbar min-h-0 space-y-6 overflow-y-auto bg-background px-4 py-4 sm:px-6 sm:py-6">
          <div className="grid gap-4 rounded-2xl border border-border/60 bg-card/70 p-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-[#ff5c00]/8 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#ff5c00]">
                1
              </p>
              <p className="mt-2 text-sm font-medium text-foreground">
                Gere o código
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Ligue o UniHub e solicite um código temporário ao servidor.
              </p>
            </div>

            <div className="rounded-2xl border border-dashed border-border bg-background/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                2
              </p>
              <p className="mt-2 text-sm font-medium text-foreground">
                Veja o código
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                O dispositivo pode exibir esse código em tela, serial ou QR code.
              </p>
            </div>

            <div className="rounded-2xl border border-dashed border-border bg-background/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                3
              </p>
              <p className="mt-2 text-sm font-medium text-foreground">
                Conclua no painel
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Clique em &quot;Parear dispositivo&quot; e informe o código temporário.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
