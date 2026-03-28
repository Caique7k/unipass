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

export default function BusesPage() {
  const { user } = useAuth();
  const canView = ["ADMIN", "DRIVER", "COORDINATOR"].includes(user?.role ?? "");
  const canManage = user?.role === "ADMIN";
  const [search, setSearch] = useState("");
  const { buses, page, setPage, lastPage, refetch } = useBuses(search);
  const [open, setOpen] = useState(false);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  if (!canView) {
    return (
      <AccessDenied description="Este perfil nao pode acessar a gestao de onibus." />
    );
  }

  const handleAskDelete = (ids: string[]) => {
    setSelectedIds(ids);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await fetch("http://localhost:3000/buses/", {
        method: "delete",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ids: selectedIds }),
      });

      setDeleteOpen(false);
      setSelectedIds([]);

      if (page > 1) setPage(1);

      refetch();
    } catch {
      toast.error("Erro ao remover onibus", {
        description: "Tente novamente mais tarde.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Onibus</h1>
        <p className="text-muted-foreground text-sm">
          {canManage
            ? "Gerencie os onibus cadastrados"
            : "Visualize todos os onibus da operacao"}
        </p>
      </div>

      <Card className="p-4 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
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
            + Novo onibus
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
