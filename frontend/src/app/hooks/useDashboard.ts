"use client";

import { useState, useEffect } from "react";

export function useDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("http://localhost:3000/dashboard", {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) throw new Error("Erro ao buscar dashboard");

        const json = await res.json();
        setData(json);
        setError(null);
        setLastUpdated(new Date());
      } catch (err: any) {
        setError(err.message);
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
