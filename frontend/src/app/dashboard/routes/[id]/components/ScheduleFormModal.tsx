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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { buildApiUrl } from "@/services/api";
import { Schedule, ScheduleType } from "../types/schedule";
import { DaysCombobox, type DayOption } from "./DaysCombobox";

type BusOption = {
  id: string;
  plate: string;
};

type SaveScheduleResponse = {
  message?: string | string[];
};

const SCHEDULE_TITLE_MAX_LENGTH = 120;
const MAX_NOTIFY_BEFORE_MINUTES = 1439;

const scheduleTypeOptions: Array<{ value: ScheduleType; label: string }> = [
  { value: "GO", label: "Ida" },
  { value: "BACK", label: "Volta" },
  { value: "SHIFT", label: "Turno" },
];

const dayOptions: DayOption[] = [
  { value: 1, label: "Segunda", shortLabel: "Seg" },
  { value: 2, label: "Terca", shortLabel: "Ter" },
  { value: 3, label: "Quarta", shortLabel: "Qua" },
  { value: 4, label: "Quinta", shortLabel: "Qui" },
  { value: 5, label: "Sexta", shortLabel: "Sex" },
  { value: 6, label: "Sabado", shortLabel: "Sab" },
  { value: 0, label: "Domingo", shortLabel: "Dom" },
];

const allDayValues = dayOptions.map((option) => option.value);

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

function normalizeSelectedDays(days: number[]) {
  return dayOptions
    .filter((option) => days.includes(option.value))
    .map((option) => option.value);
}

function isEveryDaySelected(days: number[]) {
  return allDayValues.every((day) => days.includes(day));
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
      const normalizedDays = normalizeSelectedDays(schedule.dayOfWeeks ?? []);
      const isEveryDay = isEveryDaySelected(normalizedDays);

      setType(schedule.type);
      setTitle(schedule.title || "");
      setTime(formatTimeInput(schedule.departureTime));
      setApplyEveryDay(isEveryDay);
      setSelectedDays(isEveryDay ? [] : normalizedDays);
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
      dayOfWeeks: applyEveryDay ? allDayValues : selectedDays,
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

      toast.success(
        isEdit ? "Horario atualizado com sucesso." : "Horario criado com sucesso.",
      );

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
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-hidden p-0 sm:max-w-[760px]">
        <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
          <DialogHeader className="border-b border-border/70 px-6 pt-6 pr-14 pb-4">
            <DialogTitle>{isEdit ? "Editar horario" : "Novo horario"}</DialogTitle>
            <DialogDescription>
              Configure o horario de saida, os dias de atendimento e o onibus
              vinculado.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div className="space-y-5">
              <Alert className="border-primary/20 bg-primary/5">
                <CalendarDays className="size-4" />
                <AlertTitle>Um horario, varios dias</AlertTitle>
                <AlertDescription>
                  O horario fica em um unico item na tabela e as notificacoes
                  continuam sendo enviadas nos dias selecionados.
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

              <DaysCombobox
                options={dayOptions}
                selectedValues={selectedDays}
                applyEveryDay={applyEveryDay}
                summary={selectedDaysSummary}
                onToggleDay={toggleDay}
                onApplyEveryDayChange={(nextValue) => {
                  setApplyEveryDay(nextValue);

                  if (nextValue) {
                    setSelectedDays([]);
                  }
                }}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Onibus</Label>
                  <Select
                    value={busId}
                    onValueChange={(value) => setBusId(value ?? "none")}
                  >
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
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-border/70 px-6 py-4 sm:flex-row sm:justify-end">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
