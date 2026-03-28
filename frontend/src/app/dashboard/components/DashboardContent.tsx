"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Bus, Route, Radio, ArrowUpRight } from "lucide-react";
import { UsageChart } from "../components/charts/UsageChart";
import { DashboardContentSkeleton } from "./DashboardSkeletons";

type ChartPoint = {
  date: string;
  count: number;
};

type DashboardData = {
  activeStudents: number;
  changeStudents?: string;
  trendStudents?: "up" | "down";
  busCapacityUsed: number;
  changeBuses?: string;
  trendBuses?: "up" | "down";
  tripsToday: number;
  changeTrips?: string;
  trendTrips?: "up" | "down";
  rfidReads: number;
  changeRfid?: string;
  trendRfid?: "up" | "down";
  charts: {
    boardings: ChartPoint[];
    trips: ChartPoint[];
  };
};

type DashboardContentProps = {
  data: DashboardData;
  loading: boolean;
  error: string | null;
};

export function DashboardContent({
  data,
  loading,
  error,
}: DashboardContentProps) {

  if (loading) return <DashboardContentSkeleton />;
  if (error) return <p>{error}</p>;

  return (
    <div className="space-y-8">
      {/* KPI CARDS */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Alunos Ativos"
          value={data.activeStudents}
          change={data.changeStudents}
          trend={data.trendStudents}
          icon={<Users size={18} />}
        />

        <KpiCard
          title="Alunos Embarcados Hoje"
          value={data.busCapacityUsed}
          change={data.changeBuses}
          trend={data.trendBuses}
          icon={<Bus size={18} />}
        />

        <KpiCard
          title="Viagens Hoje"
          value={data.tripsToday}
          change={data.changeTrips}
          trend={data.trendTrips}
          icon={<Route size={18} />}
        />

        <KpiCard
          title="Leituras RFID"
          value={data.rfidReads}
          change={data.changeRfid}
          trend={data.trendRfid}
          icon={<Radio size={18} />}
        />
      </div>

      {/* GRÁFICOS */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3 mt-6">
        <div className="lg:col-span-2">
          <ChartCard title="Uso por Dia">
            <UsageChart data={data.charts.boardings} />
          </ChartCard>
        </div>

        <ChartCard title="Entradas por Ônibus">
          <UsageChart data={data.charts.trips} />
        </ChartCard>
      </div>
    </div>
  );
}

// COMPONENTES AUXILIARES

function KpiCard({
  title,
  value,
  icon,
  change,
  trend,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  change?: string;
  trend?: "up" | "down";
}) {
  return (
    <Card className="bg-background/60 backdrop-blur-xl border border-border/50 transition-all hover:-translate-y-1 hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>

        <div className="p-2 bg-[#ff5c00]/10 rounded-lg text-[#ff5c00]">
          {icon}
        </div>
      </CardHeader>

      <CardContent>
        <div className="text-2xl font-bold">{value}</div>

        {/* Setinha de tendência */}
        {change !== undefined && trend !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            <ArrowUpRight
              size={14}
              className={
                trend === "up" ? "text-green-500" : "text-red-500 rotate-180"
              }
            />
            <p
              className={`text-xs ${
                trend === "up" ? "text-green-500" : "text-red-500"
              }`}
            >
              {change}
            </p>
            <span className="text-xs text-muted-foreground">vs ontem</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="h-[340px] flex flex-col bg-background/60 backdrop-blur-xl border border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>

        <span className="text-xs text-muted-foreground">Últimos 7 dias</span>
      </CardHeader>

      <CardContent className="flex-1">{children}</CardContent>
    </Card>
  );
}
