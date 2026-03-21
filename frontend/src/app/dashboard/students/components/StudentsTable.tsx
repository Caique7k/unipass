"use client";

import { useState } from "react";
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

type Student = {
  id: string;
  name: string;
  registration: string;
  email?: string;
  phone?: string;
  active: boolean;
};

export function StudentsTable({
  data,
  onDelete,
  onEdit,
}: {
  data: Student[];
  onDelete: (ids: string[]) => void;
  onEdit: (student?: Student | null) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };
  const [status, setStatus] = useState<"Todos" | "Ativos" | "Inativos">(
    "Todos",
  );

  const filteredData = data.filter((student) => {
    if (status === "Ativos") return student.active;
    if (status === "Inativos") return !student.active;
    return true;
  });

  if (!data || data.length === 0) {
    return <p className="text-muted-foreground">Nenhum aluno encontrado</p>;
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

        <Button
          className="cursor-pointer"
          onClick={() => onEdit(null)}
        >
          + Novo aluno
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

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead></TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Matrícula</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredData.map((student) => (
              <TableRow
                key={student.id}
                onDoubleClick={() => onEdit(student)}
                className="cursor-pointer"
              >
                {/* CHECKBOX */}
                <TableCell>
                  <Checkbox
                    checked={selected.includes(student.id)}
                    onCheckedChange={() => toggleSelect(student.id)}
                  />
                </TableCell>

                <TableCell className="font-medium">{student.name}</TableCell>

                <TableCell>{student.registration}</TableCell>

                <TableCell>{student.email || "-"}</TableCell>

                <TableCell>{student.phone || "-"}</TableCell>

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
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
