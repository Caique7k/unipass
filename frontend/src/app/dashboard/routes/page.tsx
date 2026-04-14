"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/app/contexts/AuthContext";
import { AccessDenied } from "@/components/AccessDenied";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageTableSkeleton } from "../components/DashboardSkeletons";
import { buildApiUrl } from "@/services/api";
import { useRoutes } from "./hooks/useRoutes";
import { RoutesTable } from "./components/RoutesTable";
import { RouteModal } from "./components/RouteFormModal";
import { DeleteRoutesDialog } from "./components/DialogDelete";
import { Route } from "./types/route.types";

export default function RoutesPage() {
  const { user } = useAuth();
  const canView = ["ADMIN", "DRIVER", "COORDINATOR"].includes(user?.role ?? "");
  const canManage = user?.role === "ADMIN";
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"Todos" | "Ativos" | "Inativos">(
    "Ativos",
  );
  const activeFilter = status === "Todos" ? undefined : status === "Ativos";
  const { data, loading, isFetching, lastPage, refetch } = useRoutes(
    search,
    page,
    activeFilter,
  );
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Route | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  if (!canView) {
    return (
      <AccessDenied description="Este perfil não pode acessar a gestão de rotas." />
    );
  }

  if (loading) {
    return <PageTableSkeleton showAction={canManage} />;
  }

  function handleCreate() {
    setEditing(null);
    setOpen(true);
  }

  const handleAskDelete = (ids: string[]) => {
    setSelectedIds(ids);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedIds.length === 0) {
      return;
    }

    try {
      const response = await fetch(buildApiUrl("/routes/deactivate"), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
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
          ? "Rota desativada com sucesso."
          : "Rotas desativadas com sucesso.",
      );

      refetch();
    } catch {
      toast.error("Erro ao desativar rotas.", {
        description: "Tente novamente em instantes.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Rotas</h1>
        <p className="text-sm text-muted-foreground">
          {canManage
            ? "Organize as rotas e seus horários em um único fluxo."
            : "Visualize as rotas configuradas para a operação."}
        </p>
      </div>

      <Card className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
        <Input
          placeholder="Buscar por nome ou descrição..."
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          className="max-w-sm"
        />

        {canManage && (
          <Button onClick={handleCreate} className="cursor-pointer">
            + Nova rota
          </Button>
        )}
      </Card>

      {isFetching && (
        <p className="animate-pulse text-xs text-muted-foreground">
          Atualizando...
        </p>
      )}

      <Card className="p-4">
        <RoutesTable
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
          onEdit={(route) => {
            if (!canManage) {
              return;
            }

            setEditing(route ?? null);
            setOpen(true);
          }}
        />
      </Card>

      {canManage && (
        <>
          <RouteModal
            open={open}
            onOpenChange={setOpen}
            route={editing}
            onSuccess={() => refetch()}
          />

          <DeleteRoutesDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            onConfirm={handleConfirmDelete}
            count={selectedIds.length}
          />
        </>
      )}
    </div>
  );
}
