"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { buildApiUrl } from "@/services/api";
import type { Group } from "../types/group";

export function GroupFormModal({
  open,
  onOpenChange,
  group,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group?: Group | null;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const isEdit = !!group?.id;

  useEffect(() => {
    setName(group?.name ?? "");
  }, [group, open]);

  async function handleSubmit() {
    if (!name.trim()) {
      toast.error("Informe o nome do grupo.");
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch(
        isEdit ? buildApiUrl(`/groups/${group?.id}`) : buildApiUrl("/groups"),
        {
          method: isEdit ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            name,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erro ao salvar grupo");
      }

      toast.success(
        isEdit ? "Grupo atualizado com sucesso." : "Grupo criado com sucesso.",
      );

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao salvar grupo.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar grupo" : "Novo grupo"}</DialogTitle>
          <DialogDescription>
            Defina um nome para identificar esse grupo de colaboradores.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome do grupo</label>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex.: Usina, Faculdade, Turno A"
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
              onClick={handleSubmit}
              disabled={isSaving}
              className="cursor-pointer"
            >
              {isSaving
                ? "Salvando..."
                : isEdit
                  ? "Salvar alterações"
                  : "Criar grupo"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
