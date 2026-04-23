"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Route, Search, Truck, UserCheck, UserX } from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import { PageTableSkeleton } from "@/app/dashboard/components/DashboardSkeletons";
import { AccessDenied } from "@/components/AccessDenied";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/services/api";

const BOARDED_PAGE_SIZE = 5;

type BoardingOverviewResponse = {
  dateKey: string;
  generatedAt: string;
  summary: {
    studentsWithFirstBoarding: number;
    waitingSecondBoarding: number;
    secondBoardingDone: number;
    busesWithSecondBoarding: number;
  };
  busOptions: Array<{
    value: string;
    label: string;
  }>;
  boardedStudents: Array<{
    id: string;
    name: string;
    registration: string;
    email: string | null;
    phone: string | null;
    group: {
      id: string;
      name: string;
    } | null;
    rfidTag: string | null;
    routeNames: string[];
    boardingCountToday: number;
    firstBoardingAt: string;
    secondBoardingAt: string;
    busId: string | null;
    busFilterKey: string;
    busPlate: string;
    capacity: number | null;
    deviceId: string;
    deviceCode: string | null;
    deviceName: string | null;
  }>;
  notBoardedStudents: Array<{
    id: string;
    name: string;
    registration: string;
    email: string | null;
    phone: string | null;
    group: {
      id: string;
      name: string;
    } | null;
    rfidTag: string | null;
    routeNames: string[];
    boardingCountToday: number;
    firstBoardingAt: string;
    firstDeviceId: string;
    firstDeviceCode: string | null;
    firstDeviceName: string | null;
    firstBusId: string | null;
    firstBusPlate: string;
  }>;
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDateKey(dateKey: string) {
  if (!dateKey) {
    return "--/--/----";
  }

  const [year, month, day] = dateKey.split("-");
  return `${day}/${month}/${year}`;
}

function formatLastUpdated(value: string | null) {
  if (!value) {
    return "Atualizando...";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

function matchesSearch(value: string, search: string) {
  return value.toLowerCase().includes(search.trim().toLowerCase());
}

export default function BoardingPage() {
  const { user } = useAuth();
  const canView = ["ADMIN", "DRIVER", "COORDINATOR"].includes(user?.role ?? "");

  const [data, setData] = useState<BoardingOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notBoardedSearch, setNotBoardedSearch] = useState("");
  const [boardedSearch, setBoardedSearch] = useState("");
  const [selectedBusFilter, setSelectedBusFilter] = useState("all");
  const [boardedPage, setBoardedPage] = useState(1);

  const loadOverview = useCallback(
    async (mode: "initial" | "refresh" = "refresh") => {
      if (!canView) {
        return;
      }

      if (mode === "initial") {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        const response = await api.get<BoardingOverviewResponse>(
          "/transport/boarding-overview/today",
        );

        setData(response.data);
        setError(null);
      } catch {
        setError("Não foi possível carregar o painel de embarques.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [canView],
  );

  useEffect(() => {
    void loadOverview("initial");
  }, [loadOverview]);

  useEffect(() => {
    if (!canView) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void loadOverview("refresh");
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [canView, loadOverview]);

  useEffect(() => {
    setBoardedPage(1);
  }, [boardedSearch, selectedBusFilter, data?.generatedAt]);

  if (!canView) {
    return (
      <AccessDenied description="Este perfil não pode acessar o painel de embarques." />
    );
  }

  if (loading) {
    return <PageTableSkeleton showAction={false} compact />;
  }

  const filteredNotBoardedStudents =
    data?.notBoardedStudents.filter((student) =>
      matchesSearch(
        `${student.name} ${student.registration} ${student.group?.name ?? ""}`,
        notBoardedSearch,
      ),
    ) ?? [];

  const filteredBoardedStudents =
    data?.boardedStudents.filter((student) => {
      const matchesName = matchesSearch(
        `${student.name} ${student.registration} ${student.group?.name ?? ""}`,
        boardedSearch,
      );
      const matchesBus =
        selectedBusFilter === "all" || student.busFilterKey === selectedBusFilter;

      return matchesName && matchesBus;
    }) ?? [];

  const boardedLastPage = Math.max(
    1,
    Math.ceil(filteredBoardedStudents.length / BOARDED_PAGE_SIZE),
  );
  const currentBoardedPage = Math.min(boardedPage, boardedLastPage);
  const boardedPageStart = (currentBoardedPage - 1) * BOARDED_PAGE_SIZE;
  const paginatedBoardedStudents = filteredBoardedStudents.slice(
    boardedPageStart,
    boardedPageStart + BOARDED_PAGE_SIZE,
  );
  const selectedBusLabel =
    selectedBusFilter === "all"
      ? "Todos os ônibus"
      : data?.busOptions.find((option) => option.value === selectedBusFilter)
          ?.label ?? "Todos os ônibus";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Retorno do dia</h1>
          <p className="text-sm text-muted-foreground">
            Alunos com 1 boarding aguardando a volta e alunos com 2 boarding ja
            embarcados para ir embora.
          </p>
        </div>

        <div className="flex flex-col items-start gap-2 md:items-end">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Referencia: {formatDateKey(data?.dateKey ?? "")}
          </p>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              Atualizado as {formatLastUpdated(data?.generatedAt ?? null)}
            </span>
            <Button
              type="button"
              variant="outline"
              onClick={() => void loadOverview("refresh")}
              disabled={refreshing}
              className="cursor-pointer"
            >
              <RefreshCw
                className={`mr-2 size-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <Card className="border-amber-300/60 bg-amber-50/70 py-4">
          <CardContent className="pt-0 text-sm text-amber-900">
            {error}
          </CardContent>
        </Card>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Com primeiro boarding"
          value={String(data?.summary.studentsWithFirstBoarding ?? 0)}
          description="Alunos que ja registraram a ida hoje"
          icon={<Route className="size-5" />}
        />
        <SummaryCard
          title="Aguardando volta"
          value={String(data?.summary.waitingSecondBoarding ?? 0)}
          description="Alunos com apenas 1 boarding no dia"
          icon={<UserX className="size-5" />}
        />
        <SummaryCard
          title="Embarcaram na volta"
          value={String(data?.summary.secondBoardingDone ?? 0)}
          description="Alunos com 2 boarding ou mais no dia"
          icon={<UserCheck className="size-5" />}
        />
        <SummaryCard
          title="Ônibus da volta"
          value={String(data?.summary.busesWithSecondBoarding ?? 0)}
          description="Veiculos com segundo boarding registrado"
          icon={<Truck className="size-5" />}
        />
      </section>

      <Card className="py-5">
        <CardHeader className="pb-0">
          <CardTitle>Embarcaram na volta</CardTitle>
          <CardDescription>
            Tabela com alunos que ja atingiram o segundo boarding do dia, com
            filtro por nome e por ônibus.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex w-full flex-col gap-3 md:flex-row">
              <div className="relative w-full max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={boardedSearch}
                  onChange={(event) => setBoardedSearch(event.target.value)}
                  placeholder="Buscar por nome ou matricula..."
                  className="pl-9"
                />
              </div>

              <Select
                value={selectedBusFilter}
                onValueChange={(value) => setSelectedBusFilter(value ?? "all")}
              >
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue placeholder="Filtrar por ônibus">
                    {selectedBusLabel}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os ônibus</SelectItem>
                  {(data?.busOptions ?? []).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <p className="text-sm text-muted-foreground">
              {filteredBoardedStudents.length} aluno(s) com volta registrada
            </p>
          </div>

          {paginatedBoardedStudents.length > 0 ? (
            <>
              <div className="rounded-2xl border border-border/60">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aluno</TableHead>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Ônibus</TableHead>
                      <TableHead>1o boarding</TableHead>
                      <TableHead>2o boarding</TableHead>
                      <TableHead>Grupo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedBoardedStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div className="min-w-[180px]">
                            <p className="font-medium">{student.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {student.deviceName || student.deviceCode || "UniHub"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{student.registration}</TableCell>
                        <TableCell>
                          <div className="min-w-[160px]">
                            <p>{student.busPlate}</p>
                            <p className="text-xs text-muted-foreground">
                              Capacidade {student.capacity ?? "--"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{formatTime(student.firstBoardingAt)}</TableCell>
                        <TableCell>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                          {formatTime(student.secondBoardingAt)}
                        </span>
                        </TableCell>
                        <TableCell>{student.group?.name || "--"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {boardedLastPage > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          setBoardedPage((current) => Math.max(1, current - 1))
                        }
                        disabled={currentBoardedPage === 1}
                      />
                    </PaginationItem>

                    {Array.from({ length: boardedLastPage }, (_, index) => index + 1).map(
                      (pageNumber) => (
                        <PaginationItem key={pageNumber}>
                          <PaginationLink
                            isActive={pageNumber === currentBoardedPage}
                            onClick={() => setBoardedPage(pageNumber)}
                          >
                            {pageNumber}
                          </PaginationLink>
                        </PaginationItem>
                      ),
                    )}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          setBoardedPage((current) =>
                            Math.min(boardedLastPage, current + 1),
                          )
                        }
                        disabled={currentBoardedPage === boardedLastPage}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          ) : (
            <EmptyState
              title="Nenhum aluno encontrado na tabela"
              description="Ajuste a busca ou o filtro de ônibus, ou aguarde o segundo boarding dos alunos."
            />
          )}
        </CardContent>
      </Card>

      <Card className="py-5">
        <CardHeader className="pb-0">
          <CardTitle>Aguardando segundo boarding</CardTitle>
          <CardDescription>
            Esta lista mostra apenas alunos que ja tiveram o primeiro boarding e
            ainda não registraram o segundo boarding da volta.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={notBoardedSearch}
                onChange={(event) => setNotBoardedSearch(event.target.value)}
                placeholder="Buscar por nome ou matricula..."
                className="pl-9"
              />
            </div>

            <p className="text-sm text-muted-foreground">
              {filteredNotBoardedStudents.length} aluno(s) aguardando a volta
            </p>
          </div>

          {filteredNotBoardedStudents.length > 0 ? (
            <div className="max-h-[34rem] overflow-y-auto pr-2">
              <Accordion className="gap-2">
                {filteredNotBoardedStudents.map((student) => (
                  <AccordionItem
                    key={student.id}
                    value={student.id}
                    className="rounded-2xl border border-border/60 px-4"
                  >
                    <AccordionTrigger className="cursor-pointer py-5 no-underline hover:no-underline">
                      <div className="flex min-w-0 flex-1 flex-col gap-2 pr-3 text-left md:flex-row md:items-center md:justify-between">
                        <div className="min-w-0">
                          <span className="block truncate text-base font-semibold text-foreground">
                            {student.name}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            Matrícula {student.registration}
                            {student.group ? ` - ${student.group.name}` : ""}
                          </span>
                        </div>

                        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                          1o boarding as {formatTime(student.firstBoardingAt)}
                        </span>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent className="pb-5">
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <AccordionDetail
                          label="Matrícula"
                          value={student.registration}
                        />
                        <AccordionDetail
                          label="Telefone"
                          value={student.phone || "Não informado"}
                        />
                        <AccordionDetail
                          label="Email"
                          value={student.email || "Não informado"}
                        />
                        <AccordionDetail
                          label="TAG"
                          value={student.rfidTag || "Não vinculada"}
                        />
                      </div>

                      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <AccordionDetail
                          label="Primeiro ônibus"
                          value={student.firstBusPlate}
                        />
                        <AccordionDetail
                          label="Primeiro UniHub"
                          value={
                            student.firstDeviceName ||
                            student.firstDeviceCode ||
                            "Não identificado"
                          }
                        />
                        <AccordionDetail
                          label="Grupo"
                          value={student.group?.name || "Sem grupo vinculado"}
                        />
                        <AccordionDetail
                          label="Rotas"
                          value={
                            student.routeNames.length > 0
                              ? student.routeNames.join(", ")
                              : "Sem rota vinculada"
                          }
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ) : (
            <EmptyState
              title="Nenhum aluno aguardando o segundo boarding"
              description="Quando o primeiro boarding acontecer, o aluno aparece aqui até registrar a volta."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <Card className="py-5">
      <CardContent className="flex items-start justify-between gap-4 pt-0">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
          <p className="mt-2 text-xs text-muted-foreground">{description}</p>
        </div>

        <div className="rounded-2xl bg-[#ffefe5] p-3 text-[#c44a00] dark:bg-[#3a2618] dark:text-[#ffb07a]">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

function AccordionDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/40 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm text-foreground">{value}</p>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 bg-background/60 px-4 py-8 text-center">
      <p className="text-base font-semibold">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
