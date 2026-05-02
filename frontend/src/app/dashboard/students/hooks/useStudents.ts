"use client";

import { useEffect, useState } from "react";
import type { BillingTemplateRecurrence } from "@/app/dashboard/billing-groups/types/billing-group";
import { buildApiUrl } from "@/services/api";

type Student = {
  id: string;
  name: string;
  registration: string;
  email?: string | null;
  phone?: string | null;
  active: boolean;
  companyId: string;
  createdAt: string;
  groupId?: string | null;
  billingTemplateId?: string | null;
  group?: {
    id: string;
    name: string;
    active: boolean;
  } | null;
  billingTemplate?: {
    id: string;
    name: string;
    active: boolean;
    amountCents: number;
    dueDay: number;
    recurrence: BillingTemplateRecurrence;
  } | null;
  billingCustomer?: {
    id: string;
    name: string;
    email?: string | null;
    document?: string | null;
    phone?: string | null;
  } | null;
  routes?: {
    route: {
      id: string;
      name: string;
      active: boolean;
    };
  }[];
  rfidCards?: {
    tag: string;
  }[];
};

type StudentsResponse = {
  data: Student[];
  lastPage: number;
};

export function useStudents(search: string, page: number, active?: boolean) {
  const [data, setData] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [lastPage, setLastPage] = useState(1);

  const fetchStudents = async ({
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

      const res = await fetch(
        `${buildApiUrl("/students")}?${params.toString()}`,
        {
          credentials: "include",
        },
      );

      if (!res.ok) {
        throw new Error("Erro ao buscar alunos");
      }

      const json = (await res.json()) as StudentsResponse;

      setData(json.data);
      setLastPage(json.lastPage);
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadStudents() {
      try {
        setIsFetching(true);

        const params = new URLSearchParams({
          page: String(page),
          limit: "10",
          ...(search && { search }),
          ...(active !== undefined && { active: String(active) }),
        });

        const res = await fetch(
          `${buildApiUrl("/students")}?${params.toString()}`,
          {
            credentials: "include",
          },
        );

        if (!res.ok) {
          throw new Error("Erro ao buscar alunos");
        }

        const json = (await res.json()) as StudentsResponse;

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

    void loadStudents();

    return () => {
      isMounted = false;
    };
  }, [search, page, active]);

  return { data, loading, isFetching, lastPage, refetch: fetchStudents };
}
