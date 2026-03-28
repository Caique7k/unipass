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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Bus } from "../types/bus";

export function BusesTable({
  data,
  canManage,
  onDelete,
  onEdit,
  page,
  setPage,
  lastPage,
}: {
  data: Bus[];
  canManage: boolean;
  onDelete: (ids: string[]) => void;
  onEdit: (bus?: Bus | null) => void;
  page: number;
  setPage: (page: number) => void;
  lastPage: number;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const validSelected = useMemo(
    () => selected.filter((id) => data.some((bus) => bus.id === id)),
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
            variant="destructive"
            disabled={validSelected.length === 0}
            onClick={() => onDelete(validSelected)}
          >
            Excluir selecionados ({validSelected.length})
          </Button>
        ) : (
          <div />
        )}
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              {canManage && <TableHead />}
              <TableHead>Placa</TableHead>
              <TableHead>Capacidade</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 3 : 2} className="text-center py-6">
                  Nenhum onibus encontrado
                </TableCell>
              </TableRow>
            ) : (
              data.map((bus) => (
                <TableRow
                  key={bus.id}
                  onDoubleClick={() => canManage && onEdit(bus)}
                  className={canManage ? "cursor-pointer" : ""}
                >
                  {canManage && (
                    <TableCell>
                      <Checkbox
                        checked={validSelected.includes(bus.id)}
                        onCheckedChange={() => toggleSelect(bus.id)}
                      />
                    </TableCell>
                  )}

                  <TableCell>{bus.plate}</TableCell>
                  <TableCell>{bus.capacity}</TableCell>
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
