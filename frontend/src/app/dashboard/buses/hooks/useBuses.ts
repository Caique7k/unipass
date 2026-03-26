"use client";

import { useState, useEffect } from "react";
import axios from "@/services/api";
import { toast } from "sonner";
import { Bus } from "../types/bus";

type FetchResponse = {
  data: Bus[];
  total: number;
  lastPage: number;
};

export function useBuses(search: string) {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  //  Buscar ônibus com paginação
  const fetchBuses = async (currentPage = page) => {
    try {
      setLoading(true);

      const res = await axios.get<FetchResponse>("/buses", {
        params: {
          page: currentPage,
          limit: 10,
          search: search || undefined, //  evita enviar search vazio
        },
      });

      setBuses(res.data.data);
      setLastPage(res.data.lastPage);
    } catch (err: any) {
      toast.error("Erro ao buscar ônibus");
    } finally {
      setLoading(false);
    }
  };

  //  Criar ônibus
  const createBus = async (payload: { plate: string; capacity: number }) => {
    try {
      await axios.post("/buses", payload);
      toast.success("Ônibus criado com sucesso!");

      fetchBuses(); //  sempre refetch
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao criar ônibus");
    }
  };

  //  Atualizar ônibus
  const updateBus = async (
    id: string,
    payload: { plate: string; capacity: number },
  ) => {
    try {
      await axios.put(`/buses/${id}`, payload);
      toast.success("Ônibus atualizado com sucesso!");

      fetchBuses(); //  refetch garante consistência
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao atualizar ônibus");
    }
  };

  //  Deletar ônibus
  const deleteBus = async (id: string) => {
    try {
      await axios.delete(`/buses/${id}`);
      toast.success("Ônibus removido com sucesso!");

      fetchBuses(); //  evita bugs de paginação
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao remover ônibus");
    }
  };

  //  sempre que page mudar → busca
  useEffect(() => {
    fetchBuses(page);
  }, [search, page]);

  return {
    buses,
    loading,
    page,
    setPage,
    lastPage,
    fetchBuses,
    createBus,
    updateBus,
    deleteBus,
    refetch: () => fetchBuses(),
  };
}
