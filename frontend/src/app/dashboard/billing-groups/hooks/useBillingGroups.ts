"use client";

import { useEffect, useState } from "react";
import { buildApiUrl } from "@/services/api";
import type { BillingGroup } from "../types/billing-group";

type BillingGroupsResponse = {
  data: BillingGroup[];
  lastPage: number;
};

export function useBillingGroups(
  search: string,
  page: number,
  active?: boolean,
) {
  const [data, setData] = useState<BillingGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [lastPage, setLastPage] = useState(1);

  const fetchBillingGroups = async ({
    searchValue = search,
    pageValue = page,
    activeValue = active,
  }: {
    searchValue?: string;
    pageValue?: number;
    activeValue?: boolean;
  } = {}) => {
    try {
      setIsFetching(true);

      const params = new URLSearchParams({
        page: String(pageValue),
        limit: "10",
        ...(searchValue && { search: searchValue }),
        ...(activeValue !== undefined && { active: String(activeValue) }),
      });

      const response = await fetch(
        `${buildApiUrl("/billing/templates")}?${params.toString()}`,
        {
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Erro ao buscar grupos de boletos");
      }

      const json = (await response.json()) as BillingGroupsResponse;
      setData(json.data);
      setLastPage(json.lastPage);
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadBillingGroups() {
      try {
        setIsFetching(true);

        const params = new URLSearchParams({
          page: String(page),
          limit: "10",
          ...(search && { search }),
          ...(active !== undefined && { active: String(active) }),
        });

        const response = await fetch(
          `${buildApiUrl("/billing/templates")}?${params.toString()}`,
          {
            credentials: "include",
          },
        );

        if (!response.ok) {
          throw new Error("Erro ao buscar grupos de boletos");
        }

        const json = (await response.json()) as BillingGroupsResponse;

        if (!isMounted) {
          return;
        }

        setData(json.data);
        setLastPage(json.lastPage);
      } finally {
        if (isMounted) {
          setLoading(false);
          setIsFetching(false);
        }
      }
    }

    void loadBillingGroups();

    return () => {
      isMounted = false;
    };
  }, [search, page, active]);

  return {
    data,
    loading,
    isFetching,
    lastPage,
    refetch: fetchBillingGroups,
  };
}
