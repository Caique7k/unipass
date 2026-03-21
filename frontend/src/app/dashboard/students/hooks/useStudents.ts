"use client";

import { useEffect, useState } from "react";

type Student = {
  id: string;
  name: string;
  registration: string;
  active: boolean;
  companyId: string;
  createdAt: string;
};

export function useStudents(search: string) {
  const [data, setData] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStudents = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `http://localhost:3000/students?search=${search}`,
        {
          credentials: "include",
        },
      );

      const json = await res.json();

      setData(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [search]);

  return { data, loading, refetch: fetchStudents };
}
