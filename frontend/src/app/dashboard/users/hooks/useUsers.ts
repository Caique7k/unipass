"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/services/api";
import type { UserRole } from "@/lib/permissions";

export type UserStatusFilter = "Todos" | "Ativos" | "Inativos";

export type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  studentId?: string | null;
  createdAt: string;
};

export function useUsers(
  enabled: boolean,
  search: string,
  status: UserStatusFilter,
  role: UserRole | "Todos",
) {
  const [data, setData] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const refetch = useCallback(async () => {
    if (!enabled) {
      setData([]);
      setLoading(false);
      setLastPage(1);
      return;
    }

    const res = await api.get("/users", {
      params: {
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(status === "Todos"
          ? {}
          : { active: status === "Ativos" ? "true" : "false" }),
        ...(role !== "Todos" ? { role } : {}),
        page,
        limit: 10,
      },
    });
    setData(res.data.data);
    setLastPage(res.data.lastPage ?? 1);
    setLoading(false);
  }, [enabled, page, role, search, status]);

  useEffect(() => {
    let cancelled = false;

    async function fetchUsers() {
      if (!enabled) {
        if (!cancelled) {
          setData([]);
          setLoading(false);
          setLastPage(1);
        }
        return;
      }

      const res = await api.get("/users", {
        params: {
          ...(search.trim() ? { search: search.trim() } : {}),
          ...(status === "Todos"
            ? {}
            : { active: status === "Ativos" ? "true" : "false" }),
          ...(role !== "Todos" ? { role } : {}),
          page,
          limit: 10,
        },
      });

      if (!cancelled) {
        setData(res.data.data);
        setLastPage(res.data.lastPage ?? 1);
        setLoading(false);
      }
    }

    void fetchUsers();

    return () => {
      cancelled = true;
    };
  }, [enabled, page, role, search, status]);
  return { data, loading, refetch, page, setPage, lastPage };
}
