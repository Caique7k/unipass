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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { buildApiUrl } from "@/services/api";
import {
  billingRecurrenceLabels,
  type BillingGroup,
  type BillingTemplateRecurrence,
} from "../types/billing-group";

const recurrenceOptions: BillingTemplateRecurrence[] = [
  "MONTHLY",
  "BIMONTHLY",
  "QUARTERLY",
  "SEMIANNUAL",
  "YEARLY",
];

function formatAmountToInput(amountCents?: number | null) {
  if (!amountCents) {
    return "";
  }

  return (amountCents / 100).toFixed(2);
}

function parseAmountToCents(value: string) {
  const normalized = value.replace(",", ".").trim();

  if (!normalized) {
    return undefined;
  }

  const amount = Number(normalized);

  if (!Number.isFinite(amount) || amount <= 0) {
    return undefined;
  }

  return Math.round(amount * 100);
}

export function BillingGroupFormModal({
  open,
  onOpenChange,
  billingGroup,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  billingGroup?: BillingGroup | null;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [recurrence, setRecurrence] =
    useState<BillingTemplateRecurrence>("MONTHLY");
  const [isSaving, setIsSaving] = useState(false);
  const isEdit = !!billingGroup?.id;

  useEffect(() => {
    setName(billingGroup?.name ?? "");
    setDescription(billingGroup?.description ?? "");
    setAmount(formatAmountToInput(billingGroup?.amountCents));
    setDueDay(billingGroup?.dueDay ? String(billingGroup.dueDay) : "");
    setRecurrence(billingGroup?.recurrence ?? "MONTHLY");
  }, [billingGroup, open]);

  async function handleSubmit() {
    const amountCents = parseAmountToCents(amount);
    const parsedDueDay = Number(dueDay);

    if (!name.trim()) {
      toast.error("Informe o nome do grupo de boletos.");
      return;
    }

    if (amountCents === undefined) {
      toast.error("Informe um valor valido em reais.");
      return;
    }

    if (
      !Number.isInteger(parsedDueDay) ||
      parsedDueDay < 1 ||
      parsedDueDay > 31
    ) {
      toast.error("Informe um dia de vencimento valido entre 1 e 31.");
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch(
        isEdit
          ? buildApiUrl(`/billing/templates/${billingGroup?.id}`)
          : buildApiUrl("/billing/templates"),
        {
          method: isEdit ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            name,
            description,
            amountCents,
            dueDay: parsedDueDay,
            recurrence,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erro ao salvar grupo de boletos");
      }

      toast.success(
        isEdit
          ? "Grupo de boletos atualizado com sucesso."
          : "Grupo de boletos criado com sucesso.",
      );

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao salvar grupo de boletos.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar grupo de boletos" : "Novo grupo de boletos"}
          </DialogTitle>
          <DialogDescription>
            Defina o nome, valor e a recorrencia que ficarao amarrados aos
            alunos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome do grupo</Label>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex.: Mensalidade transporte Unifeb"
            />
          </div>

          <div className="space-y-2">
            <Label>Descricao</Label>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Opcional: observacoes para identificar a cobranca."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="425.00"
                inputMode="decimal"
              />
            </div>

            <div className="space-y-2">
              <Label>Dia do vencimento</Label>
              <Input
                value={dueDay}
                onChange={(event) => setDueDay(event.target.value)}
                placeholder="10"
                type="number"
                min="1"
                max="31"
              />
            </div>

            <div className="space-y-2">
              <Label>Recorrencia</Label>
              <Select
                value={recurrence}
                onValueChange={(value) =>
                  setRecurrence(value as BillingTemplateRecurrence)
                }
              >
                <SelectTrigger className="cursor-pointer">
                  <SelectValue placeholder="Selecione a recorrencia" />
                </SelectTrigger>
                <SelectContent>
                  {recurrenceOptions.map((option) => (
                    <SelectItem
                      key={option}
                      value={option}
                      className="cursor-pointer"
                    >
                      {billingRecurrenceLabels[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              onClick={handleSubmit}
              disabled={isSaving}
              className="cursor-pointer"
            >
              {isSaving
                ? "Salvando..."
                : isEdit
                  ? "Salvar alteracoes"
                  : "Criar grupo"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
