"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { buildApiUrl } from "@/services/api";
import { cn } from "@/lib/utils";
import { Schedule, ScheduleType } from "../types/schedule";

type BusOption = {
  id: string;
  plate: string;
};

type SaveScheduleResponse = {
  message?: string | string[];
  createdSchedules?: Array<{ id: string }>;
};

const SCHEDULE_TITLE_MAX_LENGTH = 120;
const MAX_NOTIFY_BEFORE_MINUTES = 1439;

const scheduleTypeOptions: Array<{ value: ScheduleType; label: string }> = [
  { value: "GO", label: "Ida" },
  { value: "BACK", label: "Volta" },
  { value: "SHIFT", label: "Turno" },
];

const dayOptions = [
  { value: 1, label: "Segunda", shortLabel: "Seg" },
  { value: 2, label: "Terca", shortLabel: "Ter" },
  { value: 3, label: "Quarta", shortLabel: "Qua" },
  { value: 4, label: "Quinta", shortLabel: "Qui" },
  { value: 5, label: "Sexta", shortLabel: "Sex" },
  { value: 6, label: "Sabado", shortLabel: "Sab" },
  { value: 0, label: "Domingo", shortLabel: "Dom" },
];

function formatTimeInput(date?: string) {
  if (!date) {
    return "";
  }

  const current = new Date(date);
  const hours = String(current.getUTCHours()).padStart(2, "0");
  const minutes = String(current.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function buildDepartureTimestamp(time: string) {
  const [hours, minutes] = time.split(":");
  return Date.UTC(1970, 0, 1, Number(hours), Number(minutes), 0, 0);
}

function formatDaySummary(selectedDays: number[]) {
  if (selectedDays.length === 0) {
    return "Nenhum dia selecionado";
  }

  return dayOptions
    .filter((option) => selectedDays.includes(option.value))
    .map((option) => option.shortLabel)
    .join(", ");
}

export function ScheduleFormModal({
  open,
  onOpenChange,
  routeId,
  schedule,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routeId: string;
  schedule?: Schedule | null;
  onSuccess: () => void;
}) {
  const [type, setType] = useState<ScheduleType>("GO");
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [applyEveryDay, setApplyEveryDay] = useState(false);
  const [busId, setBusId] = useState("none");
  const [notifyBeforeMinutes, setNotifyBeforeMinutes] = useState("30");
  const [buses, setBuses] = useState<BusOption[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const isEdit = !!schedule?.id;

  const selectedDaysSummary = useMemo(() => {
    if (applyEveryDay) {
      return "Todos os dias";
    }

    return formatDaySummary(selectedDays);
  }, [applyEveryDay, selectedDays]);

  useEffect(() => {
    if (schedule) {
      setType(schedule.type);
      setTitle(schedule.title || "");
      setTime(formatTimeInput(schedule.departureTime));
      setApplyEveryDay(
        schedule.dayOfWeek === null || schedule.dayOfWeek === undefined,
      );
      setSelectedDays(
        schedule.dayOfWeek === null || schedule.dayOfWeek === undefined
          ? []
          : [schedule.dayOfWeek],
      );
      setBusId(schedule.bus?.id || "none");
      setNotifyBeforeMinutes(String(schedule.notifyBeforeMinutes));
      return;
    }

    setType("GO");
    setTitle("");
    setTime("");
    setApplyEveryDay(false);
    setSelectedDays([]);
    setBusId("none");
    setNotifyBeforeMinutes("30");
  }, [open, schedule]);

  useEffect(() => {
    if (!open) {
      return;
    }

    async function loadBuses() {
      try {
        const response = await fetch(`${buildApiUrl("/buses")}?page=1&limit=100`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error();
        }

        const json = (await response.json()) as {
          data: BusOption[];
        };

        setBuses(json.data);
      } catch {
        toast.error("Nao foi possivel carregar os onibus.");
      }
    }

    void loadBuses();
  }, [open]);

  function toggleDay(day: number) {
    setApplyEveryDay(false);
    setSelectedDays((currentDays) => {
      if (currentDays.includes(day)) {
        return currentDays.filter((value) => value !== day);
      }

      return [...currentDays, day].sort((left, right) => {
        const leftIndex = dayOptions.findIndex((option) => option.value === left);
        const rightIndex = dayOptions.findIndex((option) => option.value === right);
        return leftIndex - rightIndex;
      });
    });
  }

  async function handleSubmit() {
    const normalizedTitle = title.trim();
    const parsedNotifyBeforeMinutes = Number(notifyBeforeMinutes);

    if (!time) {
      toast.error("Informe o horario de saida.");
      return;
    }

    if (normalizedTitle.length > SCHEDULE_TITLE_MAX_LENGTH) {
      toast.error(
        `O titulo pode ter no maximo ${SCHEDULE_TITLE_MAX_LENGTH} caracteres.`,
      );
      return;
    }

    if (!Number.isInteger(parsedNotifyBeforeMinutes)) {
      toast.error("Informe uma antecedencia valida em minutos.");
      return;
    }

    if (
      parsedNotifyBeforeMinutes < 0 ||
      parsedNotifyBeforeMinutes > MAX_NOTIFY_BEFORE_MINUTES
    ) {
      toast.error(
        `A antecedencia deve ficar entre 0 e ${MAX_NOTIFY_BEFORE_MINUTES} minutos.`,
      );
      return;
    }

    if (!applyEveryDay && selectedDays.length === 0) {
      toast.error("Selecione pelo menos um dia ou marque todos os dias.");
      return;
    }

    const payload = {
      routeId,
      type,
      title: normalizedTitle || undefined,
      departureTime: buildDepartureTimestamp(time),
      ...(applyEveryDay ? { dayOfWeek: null } : { dayOfWeeks: selectedDays }),
      busId: busId === "none" ? null : busId,
      notifyBeforeMinutes: parsedNotifyBeforeMinutes,
    };

    try {
      setIsSaving(true);

      const response = await fetch(
        isEdit
          ? buildApiUrl(`/route-schedules/${schedule?.id}`)
          : buildApiUrl("/route-schedules"),
        {
          method: isEdit ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(isEdit ? { ...payload, routeId: undefined } : payload),
        },
      );

      const data = (await response.json()) as SaveScheduleResponse;

      if (!response.ok) {
        const errorMessage = Array.isArray(data.message)
          ? data.message.join(", ")
          : data.message;
        throw new Error(errorMessage || "Erro ao salvar horario");
      }

      const createdCount = data.createdSchedules?.length ?? 0;

      if (isEdit && createdCount > 0) {
        toast.success(
          `Horario atualizado e ${createdCount} novo${createdCount > 1 ? "s" : ""} horario${createdCount > 1 ? "s" : ""} criado${createdCount > 1 ? "s" : ""}.`,
        );
      } else if (!isEdit && createdCount > 1) {
        toast.success(`${createdCount} horarios criados com sucesso.`);
      } else {
        toast.success(
          isEdit
            ? "Horario atualizado com sucesso."
            : "Horario criado com sucesso.",
        );
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao salvar horario.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[760px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar horario" : "Novo horario"}</DialogTitle>
          <DialogDescription>
            Configure o horario de saida, os dias de atendimento e o onibus
            vinculado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <Alert className="border-primary/20 bg-primary/5">
            <CalendarDays className="size-4" />
            <AlertTitle>Selecionador de dias mais flexivel</AlertTitle>
            <AlertDescription>
              Na criacao voce pode marcar varios dias de uma vez. Na edicao,
              dias extras viram novos horarios automaticamente.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={type}
                onValueChange={(value) => setType((value ?? "GO") as ScheduleType)}
              >
                <SelectTrigger className="cursor-pointer">
                  <SelectValue>
                    {scheduleTypeOptions.find((item) => item.value === type)?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {scheduleTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule-time">Horario</Label>
              <Input
                id="schedule-time"
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="schedule-title">Titulo</Label>
              <Input
                id="schedule-title"
                placeholder="Ex.: Faculdade manha"
                value={title}
                maxLength={SCHEDULE_TITLE_MAX_LENGTH}
                onChange={(event) => setTitle(event.target.value)}
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Opcional. Ajuda a diferenciar turnos e operacoes.</span>
                <span>
                  {title.trim().length}/{SCHEDULE_TITLE_MAX_LENGTH}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/20 p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Label className="text-sm font-medium">Dias da semana</Label>
                <p className="text-xs text-muted-foreground">
                  Resumo atual: {selectedDaysSummary}
                </p>
              </div>
              <div className="rounded-full bg-background px-3 py-1 text-xs text-muted-foreground ring-1 ring-border">
                {applyEveryDay ? "Recorrencia diaria" : `${selectedDays.length} dia(s)`}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div
                className={cn(
                  "rounded-xl border p-3 transition-colors",
                  applyEveryDay
                    ? "border-primary bg-primary/5"
                    : "border-border bg-background",
                )}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="schedule-day-all"
                    checked={applyEveryDay}
                    onCheckedChange={(checked) => {
                      const nextValue = checked === true;
                      setApplyEveryDay(nextValue);
                      if (nextValue) {
                        setSelectedDays([]);
                      }
                    }}
                  />
                  <label
                    htmlFor="schedule-day-all"
                    className="flex-1 cursor-pointer space-y-1"
                  >
                    <p className="text-sm font-medium">Todos os dias</p>
                    <p className="text-xs text-muted-foreground">
                      Mantem um unico horario recorrente.
                    </p>
                  </label>
                </div>
              </div>

              {dayOptions.map((day) => {
                const checked = !applyEveryDay && selectedDays.includes(day.value);

                return (
                  <div
                    key={day.value}
                    className={cn(
                      "rounded-xl border p-3 transition-colors",
                      checked
                        ? "border-primary bg-primary/5"
                        : "border-border bg-background",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={`schedule-day-${day.value}`}
                        checked={checked}
                        onCheckedChange={() => toggleDay(day.value)}
                      />
                      <label
                        htmlFor={`schedule-day-${day.value}`}
                        className="flex-1 cursor-pointer space-y-1"
                      >
                        <p className="text-sm font-medium">{day.label}</p>
                        <p className="text-xs text-muted-foreground">
                          Aplicar esse horario em {day.shortLabel}.
                        </p>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Onibus</Label>
              <Select value={busId} onValueChange={(value) => setBusId(value ?? "none")}>
                <SelectTrigger className="cursor-pointer">
                  <SelectValue>
                    {busId === "none"
                      ? "Sem onibus vinculado"
                      : buses.find((bus) => bus.id === busId)?.plate}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem onibus vinculado</SelectItem>
                  {buses.map((bus) => (
                    <SelectItem key={bus.id} value={bus.id}>
                      {bus.plate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notify-before">Antecedencia do alerta</Label>
              <Input
                id="notify-before"
                type="number"
                min={0}
                max={MAX_NOTIFY_BEFORE_MINUTES}
                value={notifyBeforeMinutes}
                onChange={(event) => setNotifyBeforeMinutes(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Defina em quantos minutos antes o aluno recebe a notificacao.
              </p>
            </div>
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
                : "Criar horario"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
