"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import { RowEditButton } from "../../components/RowEditButton";
import { Route } from "../types/route.types";

export function RoutesTable({
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
  data: Route[];
  canManage: boolean;
  page: number;
  setPage: (page: number) => void;
  lastPage: number;
  status: "Todos" | "Ativos" | "Inativos";
  setStatus: (value: "Todos" | "Ativos" | "Inativos") => void;
  onDelete: (ids: string[]) => void;
  onEdit: (route?: Route | null) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const router = useRouter();
  const validSelected = useMemo(
    () => selected.filter((id) => data.some((route) => route.id === id && route.active)),
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
            onClick={() => onDelete(validSelected)}
            disabled={validSelected.length === 0}
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
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Horários</TableHead>
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
                  Nenhuma rota encontrada
                </TableCell>
              </TableRow>
            ) : (
              data.map((route) => (
                <TableRow
                  key={route.id}
                  onDoubleClick={() => canManage && onEdit(route)}
                  className={canManage ? "cursor-pointer" : ""}
                >
                  {canManage && (
                    <TableCell>
                      <Checkbox
                        checked={validSelected.includes(route.id)}
                        disabled={!route.active}
                        onCheckedChange={() => toggleSelect(route.id)}
                      />
                    </TableCell>
                  )}

                  <TableCell className="max-w-[220px] truncate">{route.name}</TableCell>
                  <TableCell className="max-w-[280px] truncate">
                    {route.description || "-"}
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="outline"
                      className="cursor-pointer rounded-xl"
                      onClick={(event) => {
                        event.stopPropagation();
                        router.push(`/dashboard/routes/${route.id}`);
                      }}
                    >
                      Ver horários ({route._count?.schedules ?? 0})
                    </Button>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`rounded px-2 py-1 text-xs ${
                        route.active
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {route.active ? "Ativa" : "Inativa"}
                    </span>
                  </TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      <RowEditButton
                        label={`Editar rota ${route.name}`}
                        onClick={() => onEdit(route)}
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
