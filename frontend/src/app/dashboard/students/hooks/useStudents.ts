"use client";

import { useEffect, useState } from "react";
import { api } from "@/services/api";

type Student = {
  id: string;
  name: string;
  registration: string;
  active: boolean;
  companyId: string;
  createdAt: string;
};

export function useStudents(search: string, page: number, active?: boolean) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [lastPage, setLastPage] = useState(1);

  const fetchStudents = async () => {
    setIsFetching(true);

    const params = new URLSearchParams({
      page: String(page),
      limit: "10",
      ...(search && { search }),
      ...(active !== undefined && { active: String(active) }), // 🔥 AQUI
    });

    const res = await fetch(
      `http://localhost:3000/students?${params.toString()}`,
      {
        credentials: "include",
      },
    );

    const json = await res.json();

    setData(json.data);
    setLastPage(json.lastPage);

    setLoading(false);
    setIsFetching(false);
  };

  useEffect(() => {
    fetchStudents();
  }, [search, page, active]); // 🔥 MUITO IMPORTANTE

  return { data, loading, isFetching, lastPage, refetch: fetchStudents };
}
