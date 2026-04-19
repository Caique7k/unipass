"use client";

import { Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const hourOptions = Array.from({ length: 24 }, (_, index) =>
  String(index).padStart(2, "0"),
);

const minuteOptions = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, "0"),
);

const quickTimeOptions = ["06:00", "07:00", "12:00", "18:00"];

function splitTime(value?: string) {
  if (!value || !value.includes(":")) {
    return {
      hour: "",
      minute: "",
    };
  }

  const [hour = "", minute = ""] = value.split(":");

  return {
    hour,
    minute,
  };
}

export function TimeSelect({
  value,
  onValueChange,
  description,
}: {
  value: string;
  onValueChange: (value: string) => void;
  description?: string;
}) {
  const { hour, minute } = splitTime(value);
  const timePreview = value || "--:--";

  function handleHourChange(nextHour: string) {
    onValueChange(`${nextHour}:${minute || "00"}`);
  }

  function handleMinuteChange(nextMinute: string) {
    onValueChange(`${hour || "00"}:${nextMinute}`);
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/20 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Clock3 className="size-4 text-muted-foreground" />
            Horario
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {description ?? "Escolha a hora e os minutos deste horario."}
          </p>
        </div>

        <div className="rounded-full bg-background px-3 py-1 text-sm font-semibold text-foreground ring-1 ring-border">
          {timePreview}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <Select
          value={hour}
          onValueChange={(nextValue) => handleHourChange(nextValue ?? "00")}
        >
          <SelectTrigger className="h-11 w-full cursor-pointer rounded-xl border-border/70 bg-background px-3">
            <SelectValue>{hour || "Hora"}</SelectValue>
          </SelectTrigger>
          <SelectContent align="start">
            {hourOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="text-center text-2xl font-semibold text-muted-foreground">
          :
        </div>

        <Select
          value={minute}
          onValueChange={(nextValue) => handleMinuteChange(nextValue ?? "00")}
        >
          <SelectTrigger className="h-11 w-full cursor-pointer rounded-xl border-border/70 bg-background px-3">
            <SelectValue>{minute || "Min"}</SelectValue>
          </SelectTrigger>
          <SelectContent align="start">
            {minuteOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap gap-2">
        {quickTimeOptions.map((option) => (
          <Button
            key={option}
            type="button"
            variant={value === option ? "secondary" : "outline"}
            size="sm"
            className="cursor-pointer rounded-full"
            onClick={() => onValueChange(option)}
          >
            {option}
          </Button>
        ))}
      </div>
    </div>
  );
}
