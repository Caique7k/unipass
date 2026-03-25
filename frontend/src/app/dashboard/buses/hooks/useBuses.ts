"use client";

import { useState, useEffect } from "react";
import axios from "@/services/api";
import { toast } from "sonner";

//  Definindo o tipo do ônibus
export type Bus = {
  id: string;
  plate: string;
  capacity: number;
  companyId: string;
  createdAt: string;
};

// ✅ Hook customizado
export function useBuses() {
  const [buses, setBuses] = useState<Bus[]>([]); // tipo definido
  const [loading, setLoading] = useState(false);

  // 🔹 Buscar todos os ônibus
  const fetchBuses = async () => {
    try {
      setLoading(true);
      const res = await axios.get<Bus[]>("/buses");
      setBuses(res.data); // agora o tipo bate com Bus[]
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao buscar ônibus");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Criar ônibus
  const createBus = async (payload: { plate: string; capacity: number }) => {
    try {
      const res = await axios.post<Bus>("/buses", payload);
      setBuses((prev) => [...prev, res.data]);
      toast.success("Ônibus criado com sucesso!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Erro ao criar ônibus");
    }
  };

  // 🔹 Editar ônibus
  const updateBus = async (
    id: string,
    payload: { plate: string; capacity: number },
  ) => {
    try {
      const res = await axios.put<Bus>(`/buses/${id}`, payload);
      setBuses((prev) => prev.map((b) => (b.id === id ? res.data : b)));
      toast.success("Ônibus atualizado com sucesso!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Erro ao atualizar ônibus");
    }
  };

  // 🔹 Deletar ônibus
  const deleteBus = async (id: string) => {
    try {
      await axios.delete(`/buses/${id}`);
      setBuses((prev) => prev.filter((b) => b.id !== id));
      toast.success("Ônibus removido com sucesso!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Erro ao remover ônibus");
    }
  };

  useEffect(() => {
    fetchBuses();
  }, []);

  return { buses, loading, fetchBuses, createBus, updateBus, deleteBus };
}
