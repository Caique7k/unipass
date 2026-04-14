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
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { buildApiUrl } from "@/services/api";
import { Route } from "../types/route.types";

export function RouteModal({
  open,
  onOpenChange,
  route,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  route?: Route | null;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const isEdit = !!route?.id;

  useEffect(() => {
    if (route) {
      setName(route.name);
      setDescription(route.description || "");
    } else {
      setName("");
      setDescription("");
    }
  }, [open, route]);

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Informe o nome da rota.");
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch(
        isEdit ? buildApiUrl(`/routes/${route?.id}`) : buildApiUrl("/routes"),
        {
          method: isEdit ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim() || undefined,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erro ao salvar rota");
      }

      toast.success(
        isEdit ? "Rota atualizada com sucesso." : "Rota criada com sucesso.",
      );

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao salvar rota.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar rota" : "Nova rota"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Atualize os dados principais da rota."
              : "Cadastre uma nova rota para organizar os horários da operação."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="route-name">Nome</Label>
            <Input
              id="route-name"
              placeholder="Ex.: Centro x Campus"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="route-description">Descrição</Label>
            <textarea
              id="route-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Detalhes adicionais, bairros atendidos ou observações."
              className="min-h-28 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="cursor-pointer"
            >
              {isSaving
                ? "Salvando..."
                : isEdit
                  ? "Salvar alterações"
                  : "Criar rota"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
