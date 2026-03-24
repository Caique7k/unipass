"use client";

import { useState } from "react";
import { useStudents } from "../students/hooks/useStudents";
import { StudentsTable } from "./components/StudentsTable";
import { StudentModal } from "./components/StudentsFormModal";
import { DeleteStudentsDialog } from "./components/DeleteDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Student = {
  id?: string;
  name?: string;
  registration?: string;
  email?: string;
  phone?: string;
  active?: boolean;
};

export default function StudentsPage() {
  const [search, setSearch] = useState("");

  // 🔥 PAGINAÇÃO
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"Todos" | "Ativos" | "Inativos">(
    "Ativos",
  );
  const activeFilter = status === "Todos" ? undefined : status === "Ativos";
  // 🔥 HOOK CORRETO
  const { data, loading, isFetching, lastPage, refetch } = useStudents(
    search,
    page,
    activeFilter,
  );

  const [open, setOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleAskDelete = (ids: string[]) => {
    setSelectedIds(ids);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    await fetch("http://localhost:3000/students/desactivate", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ids: selectedIds }),
    });

    setDeleteOpen(false);
    setSelectedIds([]);

    if (page > 1) setPage(1);

    refetch();
  };

  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    setOpen(true);
  };

  const handleCreate = () => {
    setSelectedStudent(null);
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold">Alunos</h1>
        <p className="text-muted-foreground text-sm">
          Gerencie os alunos cadastrados no sistema
        </p>
      </div>

      {/* BARRA DE AÇÕES */}
      <Card className="p-4 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <Input
          placeholder="Buscar por nome ou matrícula..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1); // ESSENCIAL
          }}
          className="max-w-sm"
        />

        <Button onClick={handleCreate} className="cursor-pointer">
          + Novo aluno
        </Button>
      </Card>
      {isFetching && (
        <p className="text-xs text-muted-foreground animate-pulse">
          Atualizando...
        </p>
      )}
      {/* TABELA */}
      <Card className="p-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando alunos...</p>
        ) : (
          <StudentsTable
            data={data}
            page={page}
            setPage={setPage}
            lastPage={lastPage}
            status={status}
            setStatus={(value) => {
              setStatus(value);
              setPage(1);
            }}
            onDelete={handleAskDelete}
            onEdit={(student) => {
              if (student) handleEdit(student);
              else handleCreate();
            }}
          />
        )}
      </Card>

      {/* MODAIS */}
      <DeleteStudentsDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleConfirmDelete}
        count={selectedIds.length}
      />

      <StudentModal
        open={open}
        onOpenChange={setOpen}
        student={selectedStudent}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
