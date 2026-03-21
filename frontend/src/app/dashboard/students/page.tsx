"use client";

import { useState } from "react";
import { useStudents } from "../students/hooks/useStudents";
import { StudentsTable } from "./components/StudentsTable";
import { StudentModal } from "./components/StudentsFormModal";
import { DeleteStudentsDialog } from "./components/DeleteDialog";

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
  const { data, loading, refetch } = useStudents(search);
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
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ ids: selectedIds }),
    });

    setDeleteOpen(false);
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
      <h1 className="text-2xl font-bold">Alunos</h1>

      <input
        placeholder="Buscar aluno..."
        onChange={(e) => setSearch(e.target.value)}
        className="border px-3 py-2 rounded"
      />

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <StudentsTable
          data={data}
          onDelete={handleAskDelete}
          onEdit={(student) => {
            if (student) handleEdit(student);
            else handleCreate();
          }}
        />
      )}
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
