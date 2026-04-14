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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { buildApiUrl } from "@/services/api";
import { Schedule, ScheduleType } from "../types/schedule";

type BusOption = {
  id: string;
  plate: string;
};

const scheduleTypeOptions: Array<{ value: ScheduleType; label: string }> = [
  { value: "GO", label: "Ida" },
  { value: "BACK", label: "Volta" },
  { value: "SHIFT", label: "Turno" },
];

const dayOptions = [
  { value: "all", label: "Todos os dias" },
  { value: "1", label: "Segunda" },
  { value: "2", label: "Terça" },
  { value: "3", label: "Quarta" },
  { value: "4", label: "Quinta" },
  { value: "5", label: "Sexta" },
  { value: "6", label: "Sábado" },
  { value: "0", label: "Domingo" },
];

function formatTimeInput(date?: string) {
  if (!date) {
    return "";
  }

  const current = new Date(date);
  const hours = String(current.getHours()).padStart(2, "0");
  const minutes = String(current.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function buildDepartureTimestamp(time: string) {
  const [hours, minutes] = time.split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date.getTime();
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
  const [dayOfWeek, setDayOfWeek] = useState("all");
  const [busId, setBusId] = useState("none");
  const [notifyBeforeMinutes, setNotifyBeforeMinutes] = useState("30");
  const [buses, setBuses] = useState<BusOption[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const isEdit = !!schedule?.id;

  useEffect(() => {
    if (schedule) {
      setType(schedule.type);
      setTitle(schedule.title || "");
      setTime(formatTimeInput(schedule.departureTime));
      setDayOfWeek(
        schedule.dayOfWeek === null || schedule.dayOfWeek === undefined
          ? "all"
          : String(schedule.dayOfWeek),
      );
      setBusId(schedule.bus?.id || "none");
      setNotifyBeforeMinutes(String(schedule.notifyBeforeMinutes));
    } else {
      setType("GO");
      setTitle("");
      setTime("");
      setDayOfWeek("all");
      setBusId("none");
      setNotifyBeforeMinutes("30");
    }
  }, [open, schedule]);

  useEffect(() => {
    if (!open) {
      return;
    }

    async function loadBuses() {
      try {
        const response = await fetch(
          `${buildApiUrl("/buses")}?page=1&limit=100`,
          {
            credentials: "include",
          },
        );

        if (!response.ok) {
          throw new Error();
        }

        const json = (await response.json()) as {
          data: BusOption[];
        };

        setBuses(json.data);
      } catch {
        toast.error("Não foi possível carregar os ônibus.");
      }
    }

    void loadBuses();
  }, [open]);

  async function handleSubmit() {
    if (!time) {
      toast.error("Informe o horário de saída.");
      return;
    }

    const payload = {
      routeId,
      type,
      title: title.trim() || undefined,
      departureTime: buildDepartureTimestamp(time),
      dayOfWeek: dayOfWeek === "all" ? null : Number(dayOfWeek),
      busId: busId === "none" ? null : busId,
      notifyBeforeMinutes: Number(notifyBeforeMinutes || "30"),
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
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erro ao salvar horário");
      }

      toast.success(
        isEdit
          ? "Horário atualizado com sucesso."
          : "Horário criado com sucesso.",
      );

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao salvar horário.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar horário" : "Novo horário"}</DialogTitle>
          <DialogDescription>
            Configure o horário de saída, o tipo de viagem e o ônibus vinculado.
          </DialogDescription>
        </DialogHeader>

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
            <Label htmlFor="schedule-time">Horário</Label>
            <Input
              id="schedule-time"
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="schedule-title">Título</Label>
            <Input
              id="schedule-title"
              placeholder="Ex.: Saída principal da manhã"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Dia da semana</Label>
            <Select
              value={dayOfWeek}
              onValueChange={(value) => setDayOfWeek(value ?? "all")}
            >
              <SelectTrigger className="cursor-pointer">
                <SelectValue>
                  {dayOptions.find((option) => option.value === dayOfWeek)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {dayOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Ônibus</Label>
            <Select value={busId} onValueChange={(value) => setBusId(value ?? "none")}>
              <SelectTrigger className="cursor-pointer">
                <SelectValue>
                  {busId === "none"
                    ? "Sem ônibus vinculado"
                    : buses.find((bus) => bus.id === busId)?.plate}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem ônibus vinculado</SelectItem>
                {buses.map((bus) => (
                  <SelectItem key={bus.id} value={bus.id}>
                    {bus.plate}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notify-before">Antecedência do alerta</Label>
            <Input
              id="notify-before"
              type="number"
              min={0}
              value={notifyBeforeMinutes}
              onChange={(event) => setNotifyBeforeMinutes(event.target.value)}
            />
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
                ? "Salvar alterações"
                : "Criar horário"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
