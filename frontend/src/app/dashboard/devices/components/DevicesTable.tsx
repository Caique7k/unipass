"use client";

import { useEffect, useState } from "react";

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

export function DevicesTable({
  data,
  onDelete,
  onEdit,
  page,
  setPage,
  lastPage,
  status,
  setStatus,
}: {
  data: Device[];
  onDelete: (ids: string[]) => void;
  onEdit: (device?: Device | null) => void;
  page: number;
  setPage: (page: number) => void;
  lastPage: number;
  status: "Todos" | "Ativos" | "Inativos";
  setStatus: (value: "Todos" | "Ativos" | "Inativos") => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    setSelected((prev) =>
      prev.filter((id) =>
        data.some((device) => device.id === id && device.active),
      ),
    );
  }, [data]);

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
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
        <Button
          className="cursor-pointer"
          onClick={() => onDelete(selected)}
          variant="destructive"
          disabled={selected.length === 0}
        >
          Desativar selecionados ({selected.length})
        </Button>

        <div className="flex items-center gap-4">
          <Select
            value={status}
            onValueChange={(value) =>
              setStatus(value as "Todos" | "Ativos" | "Inativos")
            }
          >
            <SelectTrigger className="w-[180px] cursor-pointer">
              <SelectValue placeholder="Filtrar status" />
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
              <TableHead></TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Hardware</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center">
                  Nenhum device encontrado
                </TableCell>
              </TableRow>
            ) : (
              data.map((device) => (
                <TableRow
                  key={device.id}
                  onDoubleClick={() => onEdit(device)}
                  className="cursor-pointer"
                >
                  <TableCell>
                    <Checkbox
                      checked={selected.includes(device.id)}
                      onCheckedChange={() => toggleSelect(device.id)}
                    />
                  </TableCell>

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

          {pages.map((p) => (
            <PaginationItem key={p}>
              <PaginationLink isActive={p === page} onClick={() => setPage(p)}>
                {p}
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
