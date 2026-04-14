"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/app/contexts/AuthContext";
import { AccessDenied } from "@/components/AccessDenied";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { buildApiUrl } from "@/services/api";
import { PageTableSkeleton } from "../components/DashboardSkeletons";
import { DeleteGroupsDialog } from "./components/DeleteDialog";
import { GroupFormModal } from "./components/GroupFormModal";
import { GroupsTable } from "./components/GroupsTable";
import { useGroups } from "./hooks/useGroups";
import type { Group } from "./types/group";

export default function GroupsPage() {
  const { user } = useAuth();
  const canView = ["ADMIN", "DRIVER", "COORDINATOR"].includes(user?.role ?? "");
  const canManage = user?.role === "ADMIN";
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"Todos" | "Ativos" | "Inativos">(
    "Ativos",
  );
  const activeFilter = status === "Todos" ? undefined : status === "Ativos";
  const { data, loading, isFetching, lastPage, refetch } = useGroups(
    search,
    page,
    activeFilter,
  );
  const [open, setOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  if (!canView) {
    return (
      <AccessDenied description="Este perfil não pode acessar a gestão de grupos." />
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
      const response = await fetch(buildApiUrl("/groups/deactivate"), {
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

      if (page > 1) {
        setPage(1);
      }

      toast.success(
        selectedIds.length === 1
          ? "Grupo desativado com sucesso."
          : "Grupos desativados com sucesso.",
      );

      refetch();
    } catch {
      toast.error("Erro ao desativar grupos.", {
        description: "Tente novamente em instantes.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Grupos</h1>
        <p className="text-sm text-muted-foreground">
          {canManage
            ? "Gerencie os grupos que serão usados para separar colaboradores e rotas."
            : "Visualize os grupos cadastrados para a operação."}
        </p>
      </div>

      <Card className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
        <Input
          placeholder="Buscar por nome do grupo..."
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          className="max-w-sm"
        />

        {canManage && (
          <Button
            onClick={() => {
              setSelectedGroup(null);
              setOpen(true);
            }}
            className="cursor-pointer"
          >
            + Novo grupo
          </Button>
        )}
      </Card>

      {isFetching && (
        <p className="animate-pulse text-xs text-muted-foreground">
          Atualizando...
        </p>
      )}

      <Card className="p-4">
        <GroupsTable
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
          onEdit={(group) => {
            if (!canManage) {
              return;
            }

            setSelectedGroup(group ?? null);
            setOpen(true);
          }}
        />
      </Card>

      {canManage && (
        <>
          <DeleteGroupsDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            onConfirm={handleConfirmDelete}
            count={selectedIds.length}
          />

          <GroupFormModal
            open={open}
            onOpenChange={setOpen}
            group={selectedGroup}
            onSuccess={() => refetch()}
          />
        </>
      )}
    </div>
  );
}
