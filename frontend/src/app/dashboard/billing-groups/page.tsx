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
import { BillingGroupFormModal } from "./components/BillingGroupFormModal";
import { BillingGroupsTable } from "./components/BillingGroupsTable";
import { DeleteBillingGroupsDialog } from "./components/DeleteDialog";
import { useBillingGroups } from "./hooks/useBillingGroups";
import type { BillingGroup } from "./types/billing-group";

export default function BillingGroupsPage() {
  const { user } = useAuth();
  const canView = ["ADMIN", "DRIVER", "COORDINATOR"].includes(user?.role ?? "");
  const canManage = user?.role === "ADMIN";
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"Todos" | "Ativos" | "Inativos">(
    "Ativos",
  );
  const activeFilter = status === "Todos" ? undefined : status === "Ativos";
  const { data, loading, isFetching, lastPage, refetch } = useBillingGroups(
    search,
    page,
    activeFilter,
  );
  const [open, setOpen] = useState(false);
  const [selectedBillingGroup, setSelectedBillingGroup] =
    useState<BillingGroup | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  if (!canView) {
    return (
      <AccessDenied description="Este perfil nao pode acessar a gestao de grupos de boletos." />
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
      const response = await fetch(buildApiUrl("/billing/templates/deactivate"), {
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
          ? "Grupo de boletos desativado com sucesso."
          : "Grupos de boletos desativados com sucesso.",
      );

      refetch();
    } catch {
      toast.error("Erro ao desativar grupos de boletos.", {
        description: "Tente novamente em instantes.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Grupos de boletos</h1>
        <p className="text-sm text-muted-foreground">
          {canManage
            ? "Cadastre as mensalidades e regras financeiras que ficarao amarradas aos alunos."
            : "Visualize os grupos de boletos cadastrados para a operacao financeira."}
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
              setSelectedBillingGroup(null);
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
        <BillingGroupsTable
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
          onEdit={(billingGroup) => {
            if (!canManage) {
              return;
            }

            setSelectedBillingGroup(billingGroup ?? null);
            setOpen(true);
          }}
        />
      </Card>

      {canManage && (
        <>
          <DeleteBillingGroupsDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            onConfirm={handleConfirmDelete}
            count={selectedIds.length}
          />

          <BillingGroupFormModal
            open={open}
            onOpenChange={setOpen}
            billingGroup={selectedBillingGroup}
            onSuccess={() => refetch()}
          />
        </>
      )}
    </div>
  );
}
