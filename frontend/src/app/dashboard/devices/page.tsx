"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/app/contexts/AuthContext";
import { AccessDenied } from "@/components/AccessDenied";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import api from "@/services/api";
import { useDevices } from "./hooks/useDevices";
import { DevicesTable } from "./components/DevicesTable";
import { DeviceModal } from "./components/DeviceFormModal";
import { DeleteDevicesDialog } from "./components/DeleteDialog";
import { CreateDeviceModal } from "./components/CreateDeviceModal";
import { PageTableSkeleton } from "../components/DashboardSkeletons";

type Device = {
  id?: string;
  name?: string;
  busId?: string | null;
  hardwareId?: string;
  code?: string | null;
  secret?: string | null;
  active?: boolean;
};

export default function DevicesPage() {
  const { user } = useAuth();
  const canManage = user?.role === "ADMIN";
  const [search, setSearch] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
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

  if (!canManage) {
    return (
      <AccessDenied description="Somente o administrador da empresa pode gerenciar UniHubs." />
    );
  }

  if (loading) {
    return <PageTableSkeleton />;
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
      await api.delete("/devices", {
        data: { ids: selectedIds },
      });

      toast.success(
        selectedIds.length === 1
          ? "UniHub desativado com sucesso."
          : "UniHubs desativados com sucesso.",
      );

      setDeleteOpen(false);
      setSelectedIds([]);

      if (page > 1) setPage(1);

      refetch();
    } catch (error) {
      console.error("Erro ao desativar dispositivos:", error);
      toast.error("Não foi possível desativar o UniHub.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">UniHub</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie os dispositivos cadastrados no sistema
        </p>
      </div>

      <Card className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
        <Input
          placeholder="Buscar por nome, código ou hardware..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-sm"
        />

        <div className="flex gap-2">
          <Button
            onClick={() => {
              setSelectedDevice(null);
              setOpen(true);
            }}
            className="cursor-pointer"
          >
            + Parear dispositivo
          </Button>
          <Button
            onClick={() => setOpenCreate(true)}
            variant="outline"
            className="cursor-pointer"
          >
            Veja como parear
          </Button>
        </div>
      </Card>

      {isFetching && (
        <p className="animate-pulse text-xs text-muted-foreground">
          Atualizando...
        </p>
      )}

      <Card className="p-4">
        <DevicesTable
          data={data}
          canManage
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
            setSelectedDevice(device ?? null);
            setOpen(true);
          }}
        />
      </Card>

      <DeleteDevicesDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleConfirmDelete}
        count={selectedIds.length}
      />
      <CreateDeviceModal open={openCreate} onOpenChange={setOpenCreate} />

      <DeviceModal
        open={open}
        onOpenChange={setOpen}
        device={selectedDevice}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
