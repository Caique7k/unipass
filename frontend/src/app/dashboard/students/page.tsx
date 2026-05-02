"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/app/contexts/AuthContext";
import { AccessDenied } from "@/components/AccessDenied";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useStudents } from "../students/hooks/useStudents";
import { StudentsTable } from "./components/StudentsTable";
import { StudentModal } from "./components/StudentsFormModal";
import { DeleteStudentsDialog } from "./components/DeleteDialog";
import { PageTableSkeleton } from "../components/DashboardSkeletons";
import { buildApiUrl } from "@/services/api";
import type { BillingTemplateRecurrence } from "../billing-groups/types/billing-group";

type Student = {
  id?: string;
  name?: string;
  registration?: string;
  email?: string | null;
  phone?: string | null;
  active?: boolean;
  groupId?: string | null;
  billingTemplateId?: string | null;
  group?: {
    id: string;
    name: string;
    active: boolean;
  } | null;
  billingTemplate?: {
    id: string;
    name: string;
    active: boolean;
    amountCents: number;
    dueDay: number;
    recurrence: BillingTemplateRecurrence;
  } | null;
  billingCustomer?: {
    id: string;
    name: string;
    email?: string | null;
    document?: string | null;
    phone?: string | null;
  } | null;
  routes?: {
    route: {
      id: string;
      name: string;
      active: boolean;
    };
  }[];
};

type GroupOption = {
  id: string;
  name: string;
  active: boolean;
};

type RouteOption = {
  id: string;
  name: string;
  active: boolean;
};

type BillingTemplateOption = {
  id: string;
  name: string;
  active: boolean;
  amountCents: number;
  dueDay: number;
  recurrence: BillingTemplateRecurrence;
};

export default function StudentsPage() {
  const { user } = useAuth();
  const canView = ["ADMIN", "DRIVER", "COORDINATOR"].includes(user?.role ?? "");
  const canManage = user?.role === "ADMIN";
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"Todos" | "Ativos" | "Inativos">(
    "Ativos",
  );
  const activeFilter = status === "Todos" ? undefined : status === "Ativos";
  const { data, loading, isFetching, lastPage, refetch } = useStudents(
    search,
    page,
    activeFilter,
  );

  const [open, setOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [groupOptions, setGroupOptions] = useState<GroupOption[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsLoaded, setGroupsLoaded] = useState(false);
  const [routeOptions, setRouteOptions] = useState<RouteOption[]>([]);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [routesLoaded, setRoutesLoaded] = useState(false);
  const [billingTemplateOptions, setBillingTemplateOptions] = useState<
    BillingTemplateOption[]
  >([]);
  const [billingTemplatesLoading, setBillingTemplatesLoading] = useState(false);
  const [billingTemplatesLoaded, setBillingTemplatesLoaded] = useState(false);

  useEffect(() => {
    if (!canManage || !open) {
      return;
    }

    let isMounted = true;

    async function loadGroups() {
      try {
        setGroupsLoading(true);
        setGroupsLoaded(false);

        const params = new URLSearchParams({
          page: "1",
          limit: "1000",
          active: "true",
        });

        const response = await fetch(
          `${buildApiUrl("/groups")}?${params.toString()}`,
          {
            credentials: "include",
          },
        );

        if (!response.ok) {
          throw new Error();
        }

        const json = (await response.json()) as { data: GroupOption[] };

        if (!isMounted) {
          return;
        }

        setGroupOptions(json.data);
      } catch {
        if (isMounted) {
          toast.error("Erro ao buscar grupos cadastrados.");
          setGroupOptions([]);
        }
      } finally {
        if (isMounted) {
          setGroupsLoading(false);
          setGroupsLoaded(true);
        }
      }
    }

    async function loadRoutes() {
      try {
        setRoutesLoading(true);
        setRoutesLoaded(false);

        const params = new URLSearchParams({
          page: "1",
          limit: "1000",
          active: "true",
        });

        const response = await fetch(
          `${buildApiUrl("/routes")}?${params.toString()}`,
          {
            credentials: "include",
          },
        );

        if (!response.ok) {
          throw new Error();
        }

        const json = (await response.json()) as { data: RouteOption[] };

        if (!isMounted) {
          return;
        }

        setRouteOptions(json.data);
      } catch {
        if (isMounted) {
          toast.error("Erro ao buscar rotas cadastradas.");
          setRouteOptions([]);
        }
      } finally {
        if (isMounted) {
          setRoutesLoading(false);
          setRoutesLoaded(true);
        }
      }
    }

    async function loadBillingTemplates() {
      try {
        setBillingTemplatesLoading(true);
        setBillingTemplatesLoaded(false);

        const params = new URLSearchParams({
          page: "1",
          limit: "1000",
          active: "true",
        });

        const response = await fetch(
          `${buildApiUrl("/billing/templates")}?${params.toString()}`,
          {
            credentials: "include",
          },
        );

        if (!response.ok) {
          throw new Error();
        }

        const json = (await response.json()) as {
          data: BillingTemplateOption[];
        };

        if (!isMounted) {
          return;
        }

        setBillingTemplateOptions(json.data);
      } catch {
        if (isMounted) {
          toast.error("Erro ao buscar grupos de boletos cadastrados.");
          setBillingTemplateOptions([]);
        }
      } finally {
        if (isMounted) {
          setBillingTemplatesLoading(false);
          setBillingTemplatesLoaded(true);
        }
      }
    }

    void loadGroups();
    void loadRoutes();
    void loadBillingTemplates();

    return () => {
      isMounted = false;
    };
  }, [canManage, open]);

  if (!canView) {
    return (
      <AccessDenied description="Este perfil não pode acessar a gestão de alunos." />
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
      const response = await fetch(buildApiUrl("/students/desactivate"), {
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

      if (page > 1) setPage(1);

      toast.success(
        selectedIds.length === 1
          ? "Aluno desativado com sucesso."
          : "Alunos desativados com sucesso.",
      );

      refetch();
    } catch {
      toast.error("Erro ao desativar alunos.", {
        description: "Tente novamente em instantes.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Alunos</h1>
        <p className="text-sm text-muted-foreground">
          {canManage
            ? "Gerencie os alunos cadastrados no sistema"
            : "Visualize os alunos, status de embarque e informações da operação"}
        </p>
      </div>

      <Card className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
        <Input
          placeholder="Buscar por nome ou matrícula..."
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
              setSelectedStudent(null);
              setOpen(true);
            }}
            className="cursor-pointer"
          >
            + Novo aluno
          </Button>
        )}
      </Card>

      {isFetching && (
        <p className="animate-pulse text-xs text-muted-foreground">
          Atualizando...
        </p>
      )}

      <Card className="p-4">
        <StudentsTable
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
          onEdit={(student) => {
            if (!canManage) return;
            setSelectedStudent(student ?? null);
            setOpen(true);
          }}
        />
      </Card>

      {canManage && (
        <>
          <DeleteStudentsDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            onConfirm={handleConfirmDelete}
            count={selectedIds.length}
          />

          <StudentModal
            open={open}
            onOpenChange={setOpen}
            student={selectedStudent}
            emailDomain={user?.emailDomain ?? null}
            groups={groupOptions}
            groupsLoading={groupsLoading}
            groupsLoaded={groupsLoaded}
            routes={routeOptions}
            routesLoading={routesLoading}
            routesLoaded={routesLoaded}
            billingTemplates={billingTemplateOptions}
            billingTemplatesLoading={billingTemplatesLoading}
            billingTemplatesLoaded={billingTemplatesLoaded}
            onSuccess={() => refetch()}
          />
        </>
      )}
    </div>
  );
}
