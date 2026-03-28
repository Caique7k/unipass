"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/app/contexts/AuthContext";
import { AccessDenied } from "@/components/AccessDenied";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useStudents } from "../students/hooks/useStudents";
import { StudentsTable } from "./components/StudentsTable";
import { StudentModal } from "./components/StudentsFormModal";
import { DeleteStudentsDialog } from "./components/DeleteDialog";
import { PageTableSkeleton } from "../components/DashboardSkeletons";

type Student = {
  id?: string;
  name?: string;
  registration?: string;
  email?: string;
  phone?: string;
  active?: boolean;
};

export default function StudentsPage() {
  const { user } = useAuth();
  const canView = ["ADMIN", "DRIVER", "COORDINATOR"].includes(user?.role ?? "");
  const canManage = user?.role === "ADMIN";
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"Todos" | "Ativos" | "Inativos">(
    "Ativos",
  );
  const activeFilter = status === "Todos" ? undefined : status === "Ativos";
  const { data, loading, isFetching, lastPage, refetch } = useStudents(
    search,
    page,
    activeFilter,
  );

  const [open, setOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  if (!canView) {
    return (
      <AccessDenied description="Este perfil não pode acessar a gestão de alunos." />
    );
  }

  if (loading) {
    return <PageTableSkeleton showAction={canManage} />;
  }

  const handleAskDelete = (ids: string[]) => {
    setSelectedIds(ids);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const response = await fetch("http://localhost:3000/students/desactivate", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (!response.ok) {
        throw new Error();
      }

      setDeleteOpen(false);
      setSelectedIds([]);

      if (page > 1) setPage(1);

      toast.success(
        selectedIds.length === 1
          ? "Aluno desativado com sucesso."
          : "Alunos desativados com sucesso.",
      );

      refetch();
    } catch {
      toast.error("Erro ao desativar alunos.", {
        description: "Tente novamente em instantes.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Alunos</h1>
        <p className="text-sm text-muted-foreground">
          {canManage
            ? "Gerencie os alunos cadastrados no sistema"
            : "Visualize os alunos, status de embarque e informações da operação"}
        </p>
      </div>

      <Card className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
        <Input
          placeholder="Buscar por nome ou matrícula..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-sm"
        />

        {canManage && (
          <Button
            onClick={() => {
              setSelectedStudent(null);
              setOpen(true);
            }}
            className="cursor-pointer"
          >
            + Novo aluno
          </Button>
        )}
      </Card>

      {isFetching && (
        <p className="animate-pulse text-xs text-muted-foreground">
          Atualizando...
        </p>
      )}

      <Card className="p-4">
        <StudentsTable
          data={data}
          canManage={canManage}
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
            if (!canManage) return;
            setSelectedStudent(student ?? null);
            setOpen(true);
          }}
        />
      </Card>

      {canManage && (
        <>
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
        </>
      )}
    </div>
  );
}
