import { useEffect, useState } from "react";
import api from "@/services/api";
import { Device } from "../types/device";

export function useDevices(search: string, page: number, active?: boolean) {
  const [data, setData] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [lastPage, setLastPage] = useState(1);

  async function fetchDevices() {
    try {
      setIsFetching(true);

      const res = await api.get("/devices", {
        params: {
          search,
          page,
          active,
        },
      });

      setData(res.data.data); // ⚠️ padrão esperado
      setLastPage(res.data.lastPage);
    } catch (err) {
      console.error("Erro ao buscar devices", err);
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  }

  useEffect(() => {
    fetchDevices();
  }, [search, page, active]);

  return {
    data,
    loading,
    isFetching,
    lastPage,
    refetch: fetchDevices,
  };
}
