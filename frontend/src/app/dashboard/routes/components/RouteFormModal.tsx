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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { buildApiUrl } from "@/services/api";
import { Route } from "../types/route.types";

const ROUTE_NAME_MAX_LENGTH = 120;
const ROUTE_DESCRIPTION_MAX_LENGTH = 500;

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
      return;
    }

    setName("");
    setDescription("");
  }, [open, route]);

  async function handleSave() {
    const normalizedName = name.trim();
    const normalizedDescription = description.trim();

    if (!normalizedName) {
      toast.error("Informe o nome da rota.");
      return;
    }

    if (normalizedName.length > ROUTE_NAME_MAX_LENGTH) {
      toast.error(`O nome da rota pode ter no maximo ${ROUTE_NAME_MAX_LENGTH} caracteres.`);
      return;
    }

    if (normalizedDescription.length > ROUTE_DESCRIPTION_MAX_LENGTH) {
      toast.error(
        `A descricao pode ter no maximo ${ROUTE_DESCRIPTION_MAX_LENGTH} caracteres.`,
      );
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
            name: normalizedName,
            description: normalizedDescription || undefined,
          }),
        },
      );

      const data = (await response.json()) as { message?: string | string[] };

      if (!response.ok) {
        const errorMessage = Array.isArray(data.message)
          ? data.message.join(", ")
          : data.message;
        throw new Error(errorMessage || "Erro ao salvar rota");
      }

      toast.success(
        isEdit ? "Rota atualizada com sucesso." : "Rota criada com sucesso.",
      );

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar rota.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar rota" : "Nova rota"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Atualize os dados principais da rota."
              : "Cadastre uma nova rota para organizar os horarios da operacao."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="route-name">Nome</Label>
            <Input
              id="route-name"
              placeholder="Ex.: Centro x Campus"
              value={name}
              maxLength={ROUTE_NAME_MAX_LENGTH}
              onChange={(event) => setName(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Use um nome curto e facil de localizar.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="route-description">Descricao</Label>
            <Textarea
              id="route-description"
              value={description}
              maxLength={ROUTE_DESCRIPTION_MAX_LENGTH}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Detalhes adicionais, bairros atendidos ou observacoes."
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Opcional. Campo ideal para contexto operacional.</span>
              <span>
                {description.trim().length}/{ROUTE_DESCRIPTION_MAX_LENGTH}
              </span>
            </div>
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
                  ? "Salvar alteracoes"
                  : "Criar rota"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
