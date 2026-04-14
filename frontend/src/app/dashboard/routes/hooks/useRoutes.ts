"use client";

import { useEffect, useState } from "react";
import { buildApiUrl } from "@/services/api";
import { Route } from "../types/route.types";

type RoutesResponse = {
  data: Route[];
  lastPage: number;
};

export function useRoutes(search: string, page: number, active?: boolean) {
  const [data, setData] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [lastPage, setLastPage] = useState(1);

  async function fetchRoutes({
    searchValue = search,
    pageValue = page,
    activeValue = active,
  }: {
    searchValue?: string;
    pageValue?: number;
    activeValue?: boolean;
  } = {}) {
    try {
      setIsFetching(true);

      const params = new URLSearchParams({
        page: String(pageValue),
        limit: "10",
        ...(searchValue && { search: searchValue }),
        ...(activeValue !== undefined && { active: String(activeValue) }),
      });

      const response = await fetch(`${buildApiUrl("/routes")}?${params.toString()}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Erro ao buscar rotas");
      }

      const json = (await response.json()) as RoutesResponse;

      setData(json.data);
      setLastPage(json.lastPage);
    } catch (error) {
      console.error("Erro ao buscar rotas:", error);
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  }

  useEffect(() => {
    void fetchRoutes();
  }, [active, page, search]);

  return {
    data,
    loading,
    isFetching,
    lastPage,
    refetch: fetchRoutes,
  };
}
