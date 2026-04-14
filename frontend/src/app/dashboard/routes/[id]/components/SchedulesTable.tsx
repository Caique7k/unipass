"use client";

import { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RowEditButton } from "../../../components/RowEditButton";
import { Schedule, ScheduleType } from "../types/schedule";

const scheduleTypeLabel: Record<ScheduleType, string> = {
  GO: "Ida",
  BACK: "Volta",
  SHIFT: "Turno",
};

const dayOfWeekLabel: Record<number, string> = {
  0: "Domingo",
  1: "Segunda",
  2: "Terça",
  3: "Quarta",
  4: "Quinta",
  5: "Sexta",
  6: "Sábado",
};

function formatTime(date: string) {
  const value = new Date(date);
  return `${String(value.getUTCHours()).padStart(2, "0")}:${String(value.getUTCMinutes()).padStart(2, "0")}`;
}

export function SchedulesTable({
  data,
  canManage,
  page,
  setPage,
  lastPage,
  status,
  setStatus,
  onEdit,
  onDelete,
}: {
  data: Schedule[];
  canManage: boolean;
  page: number;
  setPage: (page: number) => void;
  lastPage: number;
  status: "Todos" | "Ativos" | "Inativos";
  setStatus: (value: "Todos" | "Ativos" | "Inativos") => void;
  onEdit: (schedule?: Schedule | null) => void;
  onDelete: (ids: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const validSelected = useMemo(
    () =>
      selected.filter((id) => data.some((schedule) => schedule.id === id && schedule.active)),
    [data, selected],
  );

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(lastPage, page + 2);

  for (let index = start; index <= end; index++) {
    pages.push(index);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        {canManage ? (
          <Button
            variant="destructive"
            disabled={validSelected.length === 0}
            onClick={() => onDelete(validSelected)}
            className="cursor-pointer"
          >
            Desativar selecionados ({validSelected.length})
          </Button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-4">
          <Select
            value={status}
            onValueChange={(value) =>
              setStatus(value as "Todos" | "Ativos" | "Inativos")
            }
          >
            <SelectTrigger className="w-[180px] cursor-pointer">
              <SelectValue>{status}</SelectValue>
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="Todos">Todos</SelectItem>
              <SelectItem value="Ativos">Ativos</SelectItem>
              <SelectItem value="Inativos">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              {canManage && <TableHead />}
              <TableHead>Tipo</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Horário</TableHead>
              <TableHead>Dia</TableHead>
              <TableHead>Ônibus</TableHead>
              <TableHead>Alerta</TableHead>
              <TableHead>Status</TableHead>
              {canManage && (
                <TableHead className="w-[68px] text-right">Editar</TableHead>
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 9 : 7} className="py-6 text-center">
                  Nenhum horário encontrado
                </TableCell>
              </TableRow>
            ) : (
              data.map((schedule) => (
                <TableRow
                  key={schedule.id}
                  onDoubleClick={() => canManage && onEdit(schedule)}
                  className={canManage ? "cursor-pointer" : ""}
                >
                  {canManage && (
                    <TableCell>
                      <Checkbox
                        checked={validSelected.includes(schedule.id)}
                        disabled={!schedule.active}
                        onCheckedChange={() => toggleSelect(schedule.id)}
                      />
                    </TableCell>
                  )}

                  <TableCell>{scheduleTypeLabel[schedule.type]}</TableCell>
                  <TableCell className="max-w-[180px] truncate">
                    {schedule.title || "-"}
                  </TableCell>
                  <TableCell>{formatTime(schedule.departureTime)}</TableCell>
                  <TableCell>
                    {schedule.dayOfWeek === null || schedule.dayOfWeek === undefined
                      ? "Todos"
                      : dayOfWeekLabel[schedule.dayOfWeek]}
                  </TableCell>
                  <TableCell>{schedule.bus?.plate || "-"}</TableCell>
                  <TableCell>{schedule.notifyBeforeMinutes} min</TableCell>
                  <TableCell>
                    <span
                      className={`rounded px-2 py-1 text-xs ${
                        schedule.active
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {schedule.active ? "Ativo" : "Inativo"}
                    </span>
                  </TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      <RowEditButton
                        label={`Editar horário ${schedule.title || scheduleTypeLabel[schedule.type]}`}
                        onClick={() => onEdit(schedule)}
                      />
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            />
          </PaginationItem>

          {start > 1 && (
            <>
              <PaginationItem>
                <PaginationLink onClick={() => setPage(1)}>1</PaginationLink>
              </PaginationItem>
              {start > 2 && <span className="px-2">...</span>}
            </>
          )}

          {pages.map((currentPage) => (
            <PaginationItem key={currentPage}>
              <PaginationLink
                isActive={currentPage === page}
                onClick={() => setPage(currentPage)}
              >
                {currentPage}
              </PaginationLink>
            </PaginationItem>
          ))}

          {end < lastPage && (
            <>
              {end < lastPage - 1 && <span className="px-2">...</span>}
              <PaginationItem>
                <PaginationLink onClick={() => setPage(lastPage)}>
                  {lastPage}
                </PaginationLink>
              </PaginationItem>
            </>
          )}

          <PaginationItem>
            <PaginationNext
              onClick={() => setPage(page + 1)}
              disabled={page === lastPage}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
