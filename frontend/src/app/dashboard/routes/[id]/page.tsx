"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/app/contexts/AuthContext";
import { AccessDenied } from "@/components/AccessDenied";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageTableSkeleton } from "../../components/DashboardSkeletons";
import { buildApiUrl } from "@/services/api";
import { useSchedules } from "./hooks/useSchedules";
import { SchedulesTable } from "./components/SchedulesTable";
import { ScheduleFormModal } from "./components/ScheduleFormModal";
import { DeleteSchedulesDialog } from "./components/DeleteDialog";
import { Schedule } from "./types/schedule";

export default function RouteSchedulesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useParams();
  const routeId = String(id);
  const canView = ["ADMIN", "DRIVER", "COORDINATOR"].includes(user?.role ?? "");
  const canManage = user?.role === "ADMIN";
  const [routeName, setRouteName] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"Todos" | "Ativos" | "Inativos">(
    "Ativos",
  );
  const activeFilter = status === "Todos" ? undefined : status === "Ativos";
  const { data, loading, isFetching, lastPage, refetch } = useSchedules(
    routeId,
    search,
    page,
    activeFilter,
  );
  const [open, setOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!routeId) {
      return;
    }

    async function loadRoute() {
      try {
        const response = await fetch(buildApiUrl(`/routes/${routeId}`), {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error();
        }

        const json = (await response.json()) as {
          name: string;
        };

        setRouteName(json.name);
      } catch {
        toast.error("Não foi possível carregar a rota.");
      }
    }

    void loadRoute();
  }, [routeId]);

  if (!canView) {
    return (
      <AccessDenied description="Este perfil não pode acessar os horários da rota." />
    );
  }

  if (loading) {
    return <PageTableSkeleton showAction={canManage} />;
  }

  const handleAskDelete = (ids: string[]) => {
    setSelectedIds(ids);
    setDeleteOpen(true);
  };

  async function handleConfirmDelete() {
    if (selectedIds.length === 0) {
      return;
    }

    try {
      const response = await fetch(buildApiUrl("/route-schedules/deactivate"), {
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
          ? "Horario desativado com sucesso."
          : "Horarios desativados com sucesso.",
      );

      refetch();
    } catch {
      toast.error("Erro ao desativar horários.", {
        description: "Tente novamente em instantes.",
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit cursor-pointer"
          aria-label="Voltar para rotas"
          onClick={() => router.push("/dashboard/routes")}
        >
          {"<-"}
        </Button>

        <div>
          <h1 className="text-2xl font-bold">Horarios da rota</h1>
          <p className="text-sm text-muted-foreground">
            {routeName ? `${routeName} - ` : ""}
            Visualize e mantenha os horários da rota organizados.
          </p>
        </div>
      </div>

      <Card className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
        <Input
          placeholder="Buscar por tipo, título ou ônibus..."
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
              setSelectedSchedule(null);
              setOpen(true);
            }}
            className="cursor-pointer"
          >
            + Novo horário
          </Button>
        )}
      </Card>

      {isFetching && (
        <p className="animate-pulse text-xs text-muted-foreground">Atualizando...</p>
      )}

      <Card className="p-4">
        <SchedulesTable
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
          onEdit={(schedule) => {
            if (!canManage) {
              return;
            }

            setSelectedSchedule(schedule ?? null);
            setOpen(true);
          }}
        />
      </Card>

      {canManage && (
        <>
          <ScheduleFormModal
            open={open}
            onOpenChange={setOpen}
            routeId={routeId}
            schedule={selectedSchedule}
            onSuccess={() => refetch()}
          />

          <DeleteSchedulesDialog
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
