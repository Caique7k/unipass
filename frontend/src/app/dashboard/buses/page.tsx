"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/app/contexts/AuthContext";
import { AccessDenied } from "@/components/AccessDenied";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useBuses } from "./hooks/useBuses";
import { BusesTable } from "./components/BusesTable";
import { BusFormModal } from "./components/BusFormModal";
import { DeleteBusesDialog } from "./components/DeleteDialog";
import { Bus } from "./types/bus";
import { PageTableSkeleton } from "../components/DashboardSkeletons";
import { buildApiUrl } from "@/services/api";

export default function BusesPage() {
  const { user } = useAuth();
  const canView = ["ADMIN", "DRIVER", "COORDINATOR"].includes(user?.role ?? "");
  const canManage = user?.role === "ADMIN";
  const [search, setSearch] = useState("");
  const { buses, loading, page, setPage, lastPage, refetch } = useBuses(search);
  const [open, setOpen] = useState(false);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  if (!canView) {
    return (
      <AccessDenied description="Este perfil não pode acessar a gestão de ônibus." />
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
      const response = await fetch(buildApiUrl("/buses"), {
        method: "delete",
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
          ? "Ônibus desativado com sucesso."
          : "Ônibus desativados com sucesso.",
      );

      refetch();
    } catch {
      toast.error("Erro ao remover ônibus", {
        description: "Tente novamente mais tarde.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ônibus</h1>
        <p className="text-sm text-muted-foreground">
          {canManage
            ? "Gerencie os ônibus cadastrados"
            : "Visualize todos os ônibus da operação"}
        </p>
      </div>

      <Card className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
        <Input
          placeholder="Buscar pela placa..."
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
              setSelectedBus(null);
              setOpen(true);
            }}
            className="cursor-pointer"
          >
            + Novo ônibus
          </Button>
        )}
      </Card>

      <Card className="p-4">
        <BusesTable
          data={buses}
          canManage={canManage}
          page={page}
          setPage={setPage}
          lastPage={lastPage}
          onDelete={handleAskDelete}
          onEdit={(bus) => {
            if (!canManage) return;
            setSelectedBus(bus ?? null);
            setOpen(true);
          }}
        />
      </Card>

      {canManage && (
        <>
          <BusFormModal
            open={open}
            setOpen={setOpen}
            bus={selectedBus}
            onSuccess={() => refetch()}
          />
          <DeleteBusesDialog
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
