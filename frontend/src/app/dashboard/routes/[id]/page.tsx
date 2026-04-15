"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/app/contexts/AuthContext";
import { AccessDenied } from "@/components/AccessDenied";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
        toast.error("Nao foi possivel carregar a rota.");
      }
    }

    void loadRoute();
  }, [routeId]);

  if (!canView) {
    return (
      <AccessDenied description="Este perfil nao pode acessar os horarios da rota." />
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
      toast.error("Erro ao desativar horarios.", {
        description: "Tente novamente em instantes.",
      });
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/70 bg-gradient-to-br from-background via-background to-muted/40">
        <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit cursor-pointer"
              onClick={() => router.push("/dashboard/routes")}
            >
              <ArrowLeft className="size-4" />
              Voltar para rotas
            </Button>
            <div className="space-y-1">
              <CardTitle>Horarios da rota</CardTitle>
              <CardDescription>
                {routeName
                  ? `${routeName} - acompanhe e ajuste os horarios configurados.`
                  : "Acompanhe e ajuste os horarios configurados."}
              </CardDescription>
            </div>
          </div>

          {canManage && (
            <Button
              onClick={() => {
                setSelectedSchedule(null);
                setOpen(true);
              }}
              className="cursor-pointer"
            >
              + Novo horario
            </Button>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Input
            placeholder="Buscar por tipo, titulo ou onibus..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="max-w-sm"
          />

          <div className="rounded-full bg-background px-3 py-1 text-xs text-muted-foreground ring-1 ring-border">
            {status === "Todos" ? "Mostrando todos" : `Filtro: ${status}`}
          </div>
        </CardContent>
      </Card>

      {isFetching && (
        <p className="animate-pulse text-xs text-muted-foreground">Atualizando...</p>
      )}

      <Card>
        <CardContent className="p-4">
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
        </CardContent>
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
