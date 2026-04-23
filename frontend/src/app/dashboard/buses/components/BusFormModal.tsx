"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Bus } from "../types/bus";
import { buildApiUrl } from "@/services/api";

export function BusFormModal({
  open,
  setOpen,
  bus,
  onSuccess,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  bus?: Bus | null;
  onSuccess: () => void;
}) {
  const [plate, setPlate] = useState("");
  const [capacity, setCapacity] = useState(40);
  const [isSaving, setIsSaving] = useState(false);

  const isEdit = !!bus?.id;

  useEffect(() => {
    if (bus) {
      setPlate(bus.plate || "");
      setCapacity(bus.capacity || 40);
    } else {
      setPlate("");
      setCapacity(40);
    }
  }, [bus, open]);

  const handleSubmit = async () => {
    if (!plate.trim()) {
      toast.error("Informe a placa do ônibus.");
      return;
    }

    if (capacity < 1) {
      toast.error("A capacidade deve ser maior que zero.");
      return;
    }

    try {
      setIsSaving(true);

      const payload = {
        plate,
        capacity,
      };

      const url = isEdit
        ? buildApiUrl(`/buses/${bus?.id}`)
        : buildApiUrl("/buses");

      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Erro ao salvar ônibus");
      }

      toast.success(
        isEdit ? "Ônibus atualizado com sucesso." : "Ônibus criado com sucesso.",
      );

      onSuccess();
      setOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar ônibus.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] flex-col overflow-hidden border-0 p-0 shadow-2xl sm:max-w-[620px]">
        <div className="border-b border-[#ff5c00]/10 bg-[#ff5c00]/[0.04] px-6 py-5">
          <DialogHeader className="gap-1">
            <DialogTitle className="text-2xl font-bold text-foreground">
              {isEdit ? "Editar ônibus" : "Novo ônibus"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {isEdit
                ? "Atualize as informações operacionais deste ônibus."
                : "Preencha os dados para cadastrar um novo ônibus."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="unipass-scrollbar min-h-0 space-y-6 overflow-y-auto bg-background px-4 py-4 sm:px-6 sm:py-6">
          <div className="grid gap-4 rounded-2xl border border-border/60 bg-card/70 p-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-[#ff5c00]/8 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#ff5c00]">
                Operação
              </p>
              <p className="mt-2 text-sm font-medium text-foreground">
                {isEdit ? "Edição de veículo" : "Novo veículo"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Ajuste placa e capacidade antes de salvar.
              </p>
            </div>

            <div className="rounded-2xl border border-dashed border-border bg-background/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Capacidade atual
              </p>
              <p className="mt-2 text-base font-semibold text-foreground">
                {capacity} passageiros
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Use os controles para definir o total de assentos.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Placa</label>
            <Input
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              placeholder="ABC1234"
              className="h-11 rounded-xl border-border/70 bg-background px-3"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">Capacidade</label>

            <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/70 p-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCapacity((c) => Math.max(1, c - 1))}
                className="h-11 w-11 rounded-xl cursor-pointer"
              >
                <Minus size={16} />
              </Button>

              <div className="min-w-24 text-center text-lg font-semibold">
                {capacity}
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setCapacity((c) => c + 1)}
                className="h-11 w-11 rounded-xl cursor-pointer"
              >
                <Plus size={16} />
              </Button>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-border/60 pt-2 sm:flex-row sm:justify-end">
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              className="w-full cursor-pointer sm:w-auto"
            >
              Cancelar
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={isSaving}
              className="h-11 w-full cursor-pointer rounded-xl px-6 sm:w-auto"
            >
              {isSaving
                ? "Salvando..."
                : isEdit
                  ? "Salvar alterações"
                  : "Criar ônibus"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
