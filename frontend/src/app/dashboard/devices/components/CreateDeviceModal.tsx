"use client";

import {
  Dialog,
  DialogContent,
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Como funciona o pareamento?</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            1. Ligue o UniHub e deixe o dispositivo solicitar um código
            temporário ao servidor.
          </p>
          <p>
            2. O dispositivo deve exibir esse código na tela, serial ou QR code.
          </p>
          <p>
            3. No painel, clique em "Parear dispositivo" e informe o código
            temporário.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
