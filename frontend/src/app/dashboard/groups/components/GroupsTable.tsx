"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { RowEditButton } from "../../components/RowEditButton";
import type { Group } from "../types/group";

export function GroupsTable({
  data,
  canManage,
  page,
  setPage,
  lastPage,
  status,
  setStatus,
  onDelete,
  onEdit,
}: {
  data: Group[];
  canManage: boolean;
  page: number;
  setPage: (page: number) => void;
  lastPage: number;
  status: "Todos" | "Ativos" | "Inativos";
  setStatus: (value: "Todos" | "Ativos" | "Inativos") => void;
  onDelete: (ids: string[]) => void;
  onEdit: (group?: Group | null) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const validSelected = useMemo(
    () => selected.filter((id) => data.some((group) => group.id === id && group.active)),
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
              <SelectValue placeholder="Filtrar status" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem className="cursor-pointer" value="Todos">
                Todos
              </SelectItem>
              <SelectItem className="cursor-pointer" value="Ativos">
                Ativos
              </SelectItem>
              <SelectItem className="cursor-pointer" value="Inativos">
                Inativos
              </SelectItem>
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
              <TableHead>Status</TableHead>
              {canManage && (
                <TableHead className="w-[68px] text-right">Editar</TableHead>
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 4 : 2} className="py-6 text-center">
                  Nenhum grupo encontrado
                </TableCell>
              </TableRow>
            ) : (
              data.map((group) => (
                <TableRow
                  key={group.id}
                  onDoubleClick={() => canManage && onEdit(group)}
                  className={canManage ? "cursor-pointer" : ""}
                >
                  {canManage && (
                    <TableCell>
                      <Checkbox
                        checked={validSelected.includes(group.id)}
                        disabled={!group.active}
                        onCheckedChange={() => toggleSelect(group.id)}
                      />
                    </TableCell>
                  )}

                  <TableCell>{group.name}</TableCell>
                  <TableCell>
                    <span
                      className={`rounded px-2 py-1 text-xs ${
                        group.active
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {group.active ? "Ativo" : "Inativo"}
                    </span>
                  </TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      <RowEditButton
                        label={`Editar grupo ${group.name}`}
                        onClick={() => onEdit(group)}
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
