"use client";

import { useState } from "react";
import { useEffect } from "react";
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

// 🔥 PAGINAÇÃO SHADCN
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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
  onDelete,
  onEdit,
  page,
  setPage,
  lastPage,
  status,
  setStatus,
}: {
  data: Student[];
  onDelete: (ids: string[]) => void;
  onEdit: (student?: Student | null) => void;
  page: number;
  setPage: (page: number) => void;
  lastPage: number;
  status: "Todos" | "Ativos" | "Inativos";
  setStatus: (value: "Todos" | "Ativos" | "Inativos") => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  useEffect(() => {
    // remove ids que não existem mais ou ficaram inativos
    setSelected((prev) =>
      prev.filter((id) =>
        data.some((student) => student.id === id && student.active),
      ),
    );
  }, [data]);

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  // 🔥 PAGINAÇÃO INTELIGENTE
  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(lastPage, page + 2);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="space-y-4">
      {/* AÇÕES */}
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

      {/* TABELA */}
      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead></TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Matrícula</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>RFID</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6">
                  Nenhum aluno encontrado
                </TableCell>
              </TableRow>
            ) : (
              data.map((student) => (
                <TableRow
                  key={student.id}
                  onDoubleClick={() => onEdit(student)}
                  className="cursor-pointer"
                >
                  <TableCell>
                    <Checkbox
                      checked={selected.includes(student.id)}
                      onCheckedChange={() => toggleSelect(student.id)}
                    />
                  </TableCell>

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
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* PAGINAÇÃO SHADCN */}
      <Pagination>
        <PaginationContent>
          {/* ANTERIOR */}
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            />
          </PaginationItem>

          {/* INÍCIO */}
          {start > 1 && (
            <>
              <PaginationItem>
                <PaginationLink onClick={() => setPage(1)}>1</PaginationLink>
              </PaginationItem>
              {start > 2 && <span className="px-2">...</span>}
            </>
          )}

          {/* MEIO */}
          {pages.map((p) => (
            <PaginationItem key={p}>
              <PaginationLink isActive={p === page} onClick={() => setPage(p)}>
                {p}
              </PaginationLink>
            </PaginationItem>
          ))}

          {/* FINAL */}
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

          {/* PRÓXIMO */}
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
