"use client";

import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";

export default function StatsCards() {
  const [stats, setStats] = useState<{
    students: number;
    buses: number;
    events: number;
  } | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await api.get("/dashboard/stats");
        setStats(res.data);
      } catch {
        setStats({ students: 0, buses: 0, events: 0 });
      }
    }
    fetchStats();
  }, []);

  if (!stats) {
    return (
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-[24px] border border-border/60 bg-card/70 p-4 text-center"
          >
            <Skeleton className="mx-auto h-8 w-16 rounded-xl" />
            <Skeleton className="mx-auto mt-3 h-4 w-20 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow text-center">
        <h2 className="text-xl font-bold">{stats.students}</h2>
        <p>Alunos</p>
      </div>
      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow text-center">
        <h2 className="text-xl font-bold">{stats.buses}</h2>
        <p>Ônibus</p>
      </div>
      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow text-center">
        <h2 className="text-xl font-bold">{stats.events}</h2>
        <p>Eventos</p>
      </div>
    </div>
  );
}
