"use client";

import { useState } from "react";
import { useStudents } from "../students/hooks/useStudents";
import { StudentsTable } from "./components/StudentsTable";

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const { data, loading } = useStudents(search);

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
          onDelete={(ids) => {}}
          onEdit={(student) => {}}
        />
      )}
    </div>
  );
}
