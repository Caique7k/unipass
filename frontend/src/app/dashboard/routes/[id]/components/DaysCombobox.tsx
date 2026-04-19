"use client";

import { useMemo, useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { CalendarDays, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type DayOption = {
  value: number;
  label: string;
  shortLabel: string;
};

export function DaysCombobox({
  options,
  selectedValues,
  applyEveryDay,
  summary,
  onToggleDay,
  onApplyEveryDayChange,
}: {
  options: DayOption[];
  selectedValues: number[];
  applyEveryDay: boolean;
  summary: string;
  onToggleDay: (day: number) => void;
  onApplyEveryDayChange: (value: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredOptions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return options;
    }

    return options.filter((option) =>
      `${option.label} ${option.shortLabel}`
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [options, search]);

  const selectedLabels = useMemo(
    () => options.filter((option) => selectedValues.includes(option.value)),
    [options, selectedValues],
  );

  return (
    <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/20 p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Label className="text-sm font-medium">Dias da semana</Label>
          <p className="text-xs text-muted-foreground">Resumo atual: {summary}</p>
        </div>
        <div className="rounded-full bg-background px-3 py-1 text-xs text-muted-foreground ring-1 ring-border">
          {applyEveryDay ? "Recorrencia diaria" : `${selectedValues.length} dia(s)`}
        </div>
      </div>

      <Popover.Root
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);

          if (!nextOpen) {
            setSearch("");
          }
        }}
      >
        <Popover.Trigger
          render={
            <Button
              type="button"
              variant="outline"
              className="h-auto w-full justify-between rounded-xl border-border/70 px-3 py-3 text-left"
            />
          }
        >
          <span className="flex min-w-0 flex-col items-start gap-1">
            <span className="flex items-center gap-2 text-sm font-medium">
              <CalendarDays className="size-4 text-muted-foreground" />
              {applyEveryDay ? "Todos os dias" : summary}
            </span>
            <span className="text-xs text-muted-foreground">
              Selecione um ou mais dias no combobox.
            </span>
          </span>
          <ChevronsUpDown className="size-4 text-muted-foreground" />
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Positioner
            sideOffset={6}
            align="start"
            className="z-[60] w-[min(var(--anchor-width),calc(100vw-2rem))]"
          >
            <Popover.Popup className="max-h-[min(60dvh,26rem)] overflow-hidden rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-md outline-none">
              <div className="space-y-2">
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar dia..."
                  className="h-9"
                />

                <button
                  type="button"
                  className={cn(
                    "flex w-full items-start justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted/70",
                    applyEveryDay && "bg-primary/5 ring-1 ring-primary/20",
                  )}
                  onClick={() => onApplyEveryDayChange(!applyEveryDay)}
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Todos os dias</p>
                    <p className="text-xs text-muted-foreground">
                      Mantem um unico horario recorrente.
                    </p>
                  </div>
                  <Check
                    className={cn(
                      "mt-0.5 size-4 shrink-0 text-primary",
                      !applyEveryDay && "invisible",
                    )}
                  />
                </button>

                <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
                  {filteredOptions.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-muted-foreground">
                      Nenhum dia encontrado.
                    </p>
                  ) : (
                    filteredOptions.map((day) => {
                      const checked =
                        !applyEveryDay && selectedValues.includes(day.value);

                      return (
                        <button
                          key={day.value}
                          type="button"
                          className={cn(
                            "flex w-full items-start justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted/70",
                            checked && "bg-primary/5 ring-1 ring-primary/20",
                          )}
                          onClick={() => onToggleDay(day.value)}
                        >
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{day.label}</p>
                            <p className="text-xs text-muted-foreground">
                              Aplicar esse horario em {day.shortLabel}.
                            </p>
                          </div>
                          <Check
                            className={cn(
                              "mt-0.5 size-4 shrink-0 text-primary",
                              !checked && "invisible",
                            )}
                          />
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-border/70 px-1 pt-2">
                  <button
                    type="button"
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                    onClick={() => setSearch("")}
                  >
                    Limpar busca
                  </button>
                  <button
                    type="button"
                    className="text-xs font-medium text-foreground transition-colors hover:text-primary"
                    onClick={() => setOpen(false)}
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>

      {!applyEveryDay && selectedLabels.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedLabels.map((day) => (
            <span
              key={day.value}
              className="rounded-full bg-background px-2.5 py-1 text-xs text-muted-foreground ring-1 ring-border"
            >
              {day.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
