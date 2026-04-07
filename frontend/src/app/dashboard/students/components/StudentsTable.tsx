"use client";

import { useMemo, useState } from "react";
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
import { RowEditButton } from "../../components/RowEditButton";

type Student = {
  id: string;
  name: string;
  registration: string;
  email?: string;
  phone?: string;
  active: boolean;
  rfidCards?: {
    tag: string;
  }[];
};

export function StudentsTable({
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
  data: Student[];
  canManage: boolean;
  onDelete: (ids: string[]) => void;
  onEdit: (student?: Student | null) => void;
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
        data.some((student) => student.id === id && student.active),
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
              <TableHead>Matricula</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>RFID</TableHead>
              <TableHead>Status</TableHead>
              {canManage && (
                <TableHead className="w-[68px] text-right">Editar</TableHead>
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 8 : 6} className="py-6 text-center">
                  Nenhum aluno encontrado
                </TableCell>
              </TableRow>
            ) : (
              data.map((student) => (
                <TableRow
                  key={student.id}
                  onDoubleClick={() => canManage && onEdit(student)}
                  className={canManage ? "cursor-pointer" : ""}
                >
                  {canManage && (
                    <TableCell>
                      <Checkbox
                        checked={validSelected.includes(student.id)}
                        onCheckedChange={() => toggleSelect(student.id)}
                      />
                    </TableCell>
                  )}

                  <TableCell className="max-w-[150px] truncate">
                    {student.name}
                  </TableCell>
                  <TableCell>{student.registration}</TableCell>
                  <TableCell>{student.email || "-"}</TableCell>
                  <TableCell>{student.phone || "-"}</TableCell>
                  <TableCell className="max-w-[120px] truncate">
                    {student.rfidCards && student.rfidCards.length > 0
                      ? student.rfidCards.map((card) => card.tag).join(", ")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        student.active
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {student.active ? "Ativo" : "Inativo"}
                    </span>
                  </TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      <RowEditButton
                        label={`Editar ${student.name}`}
                        onClick={() => onEdit(student)}
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
