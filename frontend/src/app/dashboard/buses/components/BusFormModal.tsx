"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import api from "@/services/api";
import { toast } from "sonner";
import { Bus } from "../types/bus";

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
    try {
      setIsSaving(true);

      const payload = {
        plate,
        capacity,
      };

      const url = isEdit
        ? `http://localhost:3000/buses/${bus?.id}`
        : "http://localhost:3000/buses";

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
        isEdit ? "Ônibus atualizado com sucesso" : "Ônibus criado com sucesso",
      );

      onSuccess();
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="space-y-4">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar ônibus" : "Novo ônibus"}</DialogTitle>
        </DialogHeader>

        {/* PLACA */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Placa</label>
          <Input
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            placeholder="ABC1234"
          />
        </div>

        {/* CAPACIDADE */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Capacidade</label>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCapacity((c) => Math.max(1, c - 1))}
            >
              <Minus size={16} />
            </Button>

            <div className="w-16 text-center text-lg font-semibold">
              {capacity}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setCapacity((c) => c + 1)}
            >
              <Plus size={16} />
            </Button>
          </div>
        </div>

        {/* AÇÕES */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>

          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving
              ? "Salvando..."
              : isEdit
                ? "Salvar alterações"
                : "Criar ônibus"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
