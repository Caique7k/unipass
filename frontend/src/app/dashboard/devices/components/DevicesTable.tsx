"use client";

import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Device } from "../types/device";
import { RowEditButton } from "../../components/RowEditButton";

export function DevicesTable({
  data,
  canManage,
  onDelete,
  onEdit,
  page,
  setPage,
  lastPage,
  status,
  setStatus,
}: {
  data: Device[];
  canManage: boolean;
  onDelete: (ids: string[]) => void;
  onEdit: (device?: Device | null) => void;
  page: number;
  setPage: (page: number) => void;
  lastPage: number;
  status: "Todos" | "Ativos" | "Inativos";
  setStatus: (value: "Todos" | "Ativos" | "Inativos") => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const validSelected = useMemo(
    () =>
      selected.filter((id) =>
        data.some((device) => device.id === id && device.active),
      ),
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

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        {canManage ? (
          <Button
            className="cursor-pointer"
            onClick={() => onDelete(validSelected)}
            variant="destructive"
            disabled={validSelected.length === 0}
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
              <TableHead>Nome</TableHead>
              <TableHead>Hardware</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Status</TableHead>
              {canManage && (
                <TableHead className="w-[68px] text-right">Editar</TableHead>
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 6 : 4} className="py-6 text-center">
                  Nenhum dispositivo encontrado
                </TableCell>
              </TableRow>
            ) : (
              data.map((device) => (
                <TableRow
                  key={device.id}
                  onDoubleClick={() => canManage && onEdit(device)}
                  className={canManage ? "cursor-pointer" : ""}
                >
                  {canManage && (
                    <TableCell>
                      <Checkbox
                        checked={validSelected.includes(device.id)}
                        onCheckedChange={() => toggleSelect(device.id)}
                      />
                    </TableCell>
                  )}

                  <TableCell className="max-w-[150px] truncate">
                    {device.name}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {device.hardwareId}
                  </TableCell>
                  <TableCell className="max-w-[120px] truncate font-mono text-xs">
                    {device.code || "Aguardando claim"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`rounded px-2 py-1 text-xs ${
                        device.active
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {device.active ? "Ativo" : "Inativo"}
                    </span>
                  </TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      <RowEditButton
                        label={`Editar ${device.name}`}
                        onClick={() => onEdit(device)}
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
