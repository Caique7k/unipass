"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
  const trimmedName = name.trim();
  const trimmedDescription = description.trim();

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
    const normalizedName = trimmedName;
    const normalizedDescription = trimmedDescription;

    if (!normalizedName) {
      toast.error("Informe o nome da rota.");
      return;
    }

    if (normalizedName.length > ROUTE_NAME_MAX_LENGTH) {
      toast.error(
        `O nome da rota pode ter no maximo ${ROUTE_NAME_MAX_LENGTH} caracteres.`,
      );
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
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] flex-col overflow-hidden border-0 p-0 shadow-2xl sm:max-w-[620px]">
        <div className="border-b border-[#ff5c00]/10 bg-[#ff5c00]/[0.04] px-6 py-5">
          <DialogHeader className="gap-1">
            <DialogTitle className="text-2xl font-bold text-foreground">
              {isEdit ? "Editar rota" : "Nova rota"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {isEdit
                ? "Atualize os dados principais desta rota."
                : "Cadastre uma rota para organizar os horários da operação."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="unipass-scrollbar min-h-0 space-y-6 overflow-y-auto bg-background px-4 py-4 sm:px-6 sm:py-6">
          <div className="grid gap-4 rounded-2xl border border-border/60 bg-card/70 p-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-[#ff5c00]/8 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#ff5c00]">
                Cadastro
              </p>
              <p className="mt-2 text-sm font-medium text-foreground">
                {isEdit ? "Edicao da rota" : "Nova rota"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {isEdit
                  ? "Revise nome e descricao antes de salvar."
                  : "Defina um nome claro para localizar a rota com facilidade."}
              </p>
            </div>

            <div className="rounded-2xl border border-dashed border-border bg-background/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Resumo rápido
              </p>
              <p className="mt-2 break-words text-base font-semibold text-foreground">
                {trimmedName || "Nome ainda não definido"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {trimmedDescription ||
                  "Adicione uma descrição opcional para bairros, pontos ou observações."}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="route-name" className="text-sm font-medium">
              Nome da rota
            </Label>
            <Input
              id="route-name"
              placeholder="Ex.: Centro x Campus"
              value={name}
              maxLength={ROUTE_NAME_MAX_LENGTH}
              className="h-11 rounded-xl border-border/70 bg-background px-3"
              onChange={(event) => setName(event.target.value)}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Use um nome curto e facil de localizar.</span>
              <span>{trimmedName.length}/{ROUTE_NAME_MAX_LENGTH}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="route-description" className="text-sm font-medium">
              Descrição
            </Label>
            <Textarea
              id="route-description"
              value={description}
              maxLength={ROUTE_DESCRIPTION_MAX_LENGTH}
              className="min-h-32 rounded-2xl border-border/70 bg-background px-3 py-3"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Detalhes adicionais, bairros atendidos ou observações."
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Opcional. Campo ideal para contexto operacional.</span>
              <span>{trimmedDescription.length}/{ROUTE_DESCRIPTION_MAX_LENGTH}</span>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-border/60 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="w-full cursor-pointer sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="h-11 w-full cursor-pointer rounded-xl px-6 sm:w-auto"
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
