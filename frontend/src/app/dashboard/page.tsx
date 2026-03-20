import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { UsageChart } from "./components/charts/UsageChart";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Users, Bus, Route, Radio, ArrowUpRight } from "lucide-react";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return redirect("/login");
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do sistema UniPass
          </p>
        </div>

        <div className="text-sm text-muted-foreground">Atualizado agora</div>
      </div>

      {/* KPI CARDS */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Alunos Ativos"
          value="1.284"
          change="+12%"
          trend="up"
          icon={<Users size={18} />}
        />

        <KpiCard
          title="Ônibus em Operação"
          value="12"
          change="+2"
          trend="up"
          icon={<Bus size={18} />}
        />

        <KpiCard
          title="Viagens Hoje"
          value="38"
          change="-5%"
          trend="down"
          icon={<Route size={18} />}
        />

        <KpiCard
          title="Leituras RFID"
          value="5.921"
          change="+18%"
          trend="up"
          icon={<Radio size={18} />}
        />
      </div>

      {/* GRÁFICOS COM HIERARQUIA */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard title="Uso por Dia">
            <UsageChart />
          </ChartCard>
        </div>

        <ChartCard title="Entradas por Ônibus">
          <UsageChart />
        </ChartCard>
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon, change, trend }: any) {
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
      </CardContent>
    </Card>
  );
}

function ChartCard({ title, children }: any) {
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
