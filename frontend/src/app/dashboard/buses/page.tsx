"use client";

import { useState } from "react";
import { useBuses } from "./hooks/useBuses";
import { BusesTable } from "./components/BusesTable";
import { BusFormModal } from "./components/BusFormModal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Bus } from "./types/bus";
import { DeleteBusesDialog } from "./components/DeleteDialog";

import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function BusesPage() {
  const [search, setSearch] = useState("");
  const { buses, page, setPage, lastPage, refetch } = useBuses(search);

  const [open, setOpen] = useState(false);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleAskDelete = (ids: string[]) => {
    setSelectedIds(ids);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await fetch(`http://localhost:3000/buses/`, {
        method: "delete",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ids: selectedIds }),
      });

      setDeleteOpen(false);
      setSelectedIds([]);

      if (page > 1) setPage(1);

      refetch();
    } catch (err) {
      toast.error("Erro ao remover ônibus", {
        description: "Tente novamente mais tarde.",
      });
    }
  };
  const handleEdit = (bus: Bus) => {
    setSelectedBus(bus);
    setOpen(true);
  };

  const handleCreate = () => {
    setSelectedBus(null);
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold">Ônibus</h1>
        <p className="text-muted-foreground text-sm">
          Gerencie os ônibus cadastrados
        </p>
      </div>

      {/* AÇÕES */}
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
        <Button onClick={handleCreate} className="cursor-pointer">
          + Novo ônibus
        </Button>
      </Card>

      {/* TABELA */}
      <Card className="p-4">
        <BusesTable
          data={buses}
          page={page}
          setPage={setPage}
          lastPage={lastPage}
          onDelete={handleAskDelete}
          onEdit={(bus) => {
            if (bus) handleEdit(bus);
            else handleCreate();
          }}
        />
      </Card>

      {/* MODAL */}
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
    </div>
  );
}
