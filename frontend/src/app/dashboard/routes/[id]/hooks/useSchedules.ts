import { useEffect, useState } from "react";
import { buildApiUrl } from "@/services/api";
import { Schedule } from "../types/schedule";

type SchedulesResponse = {
  data: Schedule[];
  lastPage: number;
};

export function useSchedules(
  routeId: string,
  search: string,
  page: number,
  active?: boolean,
) {
  const [data, setData] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [lastPage, setLastPage] = useState(1);

  async function fetchSchedules({
    searchValue = search,
    pageValue = page,
    activeValue = active,
  }: {
    searchValue?: string;
    pageValue?: number;
    activeValue?: boolean;
  } = {}) {
    if (!routeId) {
      return;
    }

    try {
      setIsFetching(true);

      const params = new URLSearchParams({
        page: String(pageValue),
        limit: "10",
        ...(searchValue && { search: searchValue }),
        ...(activeValue !== undefined && { active: String(activeValue) }),
      });

      const response = await fetch(
        `${buildApiUrl(`/route-schedules/${routeId}`)}?${params.toString()}`,
        {
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Erro ao buscar horários");
      }

      const json = (await response.json()) as SchedulesResponse;

      setData(json.data);
      setLastPage(json.lastPage);
    } catch (error) {
      console.error("Erro ao buscar horários:", error);
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  }

  useEffect(() => {
    void fetchSchedules();
  }, [active, page, routeId, search]);

  return {
    data,
    loading,
    isFetching,
    lastPage,
    refetch: fetchSchedules,
  };
}
