"use client";

import { useState, useEffect } from "react";

export function useDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("http://localhost:3000/dashboard", {
          credentials: "include", // ESSENCIAL para cookies httpOnly
        });
        if (!res.ok) throw new Error("Erro ao buscar dashboard");
        const json = await res.json();
        setData(json);
        console.log("Dashboard data:", json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  return { data, loading, error };
}
