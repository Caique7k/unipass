"use client";

import { useState } from "react";
import { DevicesTable } from "./components/DevicesTable";
import { DeviceModal } from "./components/DeviceFormModal";
import { DeleteDevicesDialog } from "./components/DeleteDialog";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { useDevices } from "./hooks/useDevices";

type Device = {
  id?: string;
  name?: string;
  identifier?: string;
  code?: string;
  secret?: string;
  active?: boolean;
};

export default function DevicesPage() {
  const [search, setSearch] = useState("");

  // 🔥 PAGINAÇÃO
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"Todos" | "Ativos" | "Inativos">(
    "Ativos",
  );

  const activeFilter = status === "Todos" ? undefined : status === "Ativos";

  const { data, loading, isFetching, lastPage, refetch } = useDevices(
    search,
    page,
    activeFilter,
  );

  const [open, setOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleAskDelete = (ids: string[]) => {
    setSelectedIds(ids);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    await fetch("http://localhost:3000/devices/desactivate", {
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

  const handleEdit = (device: Device) => {
    setSelectedDevice(device);
    setOpen(true);
  };

  const handleCreate = () => {
    setSelectedDevice(null);
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold">Dispositivos</h1>
        <p className="text-muted-foreground text-sm">
          Gerencie os dispositivos cadastrados no sistema
        </p>
      </div>

      {/* BARRA DE AÇÕES */}
      <Card className="p-4 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <Input
          placeholder="Buscar por nome ou identifier..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-sm"
        />

        <Button onClick={handleCreate} className="cursor-pointer">
          + Novo device
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
          <p className="text-sm text-muted-foreground">Carregando devices...</p>
        ) : (
          <DevicesTable
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
            onEdit={(device) => {
              if (device) handleEdit(device);
              else handleCreate();
            }}
          />
        )}
      </Card>

      {/* MODAIS */}
      <DeleteDevicesDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleConfirmDelete}
        count={selectedIds.length}
      />

      <DeviceModal
        open={open}
        onOpenChange={setOpen}
        device={selectedDevice}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
