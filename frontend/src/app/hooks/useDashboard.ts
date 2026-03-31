"use client";

import { useState, useEffect } from "react";
import { buildApiUrl } from "@/services/api";
import type { DashboardData } from "../dashboard/components/DashboardContent";

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch(buildApiUrl("/dashboard"), {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) throw new Error("Erro ao buscar dashboard");

        const json = (await res.json()) as DashboardData;
        setData(json);
        setError(null);
        setLastUpdated(new Date());
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Erro ao buscar dashboard",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();

    const interval = setInterval(() => {
      fetchDashboard();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return { data, loading, error, lastUpdated };
}
